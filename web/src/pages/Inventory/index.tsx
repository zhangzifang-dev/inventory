import { useEffect, useState } from 'react';
import { Table, Card, Tag, InputNumber, Button, message, Modal, Form, Select, Badge, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { inventoryApi } from '@/services/api';

export default function Inventory() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustVisible, setAdjustVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filterForm] = Form.useForm();
  const [filterCount, setFilterCount] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async (page = 1, pageSize = 10, filters?: { sku?: string; name?: string }) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters?.sku) params.sku = filters.sku;
      if (filters?.name) params.name = filters.name;
      const res = await inventoryApi.list(params);
      setData(res.data?.list || []);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: res.data?.total || 0 }));
    } finally { setLoading(false); }
  };

  const handleSearch = () => {
    const values = filterForm.getFieldsValue();
    const count = Object.values(values).filter((v: any) => v !== undefined && v !== '').length;
    setFilterCount(count);
    loadData(1, pagination.pageSize, values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdjust = (record: any) => {
    setCurrentItem(record);
    form.resetFields();
    setAdjustVisible(true);
  };

  const handleAdjustSubmit = async () => {
    const values = await form.validateFields();
    await inventoryApi.update({
      productId: currentItem.productId,
      quantity: currentItem.quantity + values.adjustQuantity,
      type: values.adjustQuantity > 0 ? 'in' : 'out',
      reason: values.reason,
    });
    message.success('调整成功');
    setAdjustVisible(false);
    handleSearch();
  };

  const columns = [
    { title: '#', key: 'index', width: 60, render: (_: any, __: any, index: number) => (pagination.current - 1) * pagination.pageSize + index + 1 },
    { title: '商品', dataIndex: ['product', 'name'], key: 'product' },
    { title: 'SKU', dataIndex: ['product', 'sku'], key: 'sku', width: 100 },
    { title: '当前库存', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: '预警值', dataIndex: 'warningQuantity', key: 'warningQuantity', width: 80 },
    { title: '状态', key: 'status', width: 100, render: (_: any, record: any) => (
      record.quantity <= record.warningQuantity ? <Tag color="red">库存不足</Tag> : <Tag color="green">正常</Tag>
    )},
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 110, render: (v: string) => new Date(v).toLocaleDateString() },
    { title: '操作', key: 'action', width: 100, render: (_: any, record: any) => (
      <Button type="link" size="small" onClick={() => handleAdjust(record)}>调整</Button>
    )},
  ];

  return (
    <Card 
      extra={
        <Form form={filterForm} layout="inline" style={{ gap: 8 }}>
          <Form.Item name="sku">
            <Input placeholder="SKU" allowClear style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="name">
            <Input placeholder="商品名称" allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询{filterCount > 0 && <Badge count={filterCount} style={{ marginLeft: 4 }} />}</Button>
          </Form.Item>
        </Form>
      }
    >
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, onChange: (page, pageSize) => loadData(page, pageSize, filterForm.getFieldsValue()) }} />
      <Modal title="库存调整" open={adjustVisible} onOk={handleAdjustSubmit} onCancel={() => setAdjustVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="当前库存">{currentItem?.quantity}</Form.Item>
          <Form.Item name="adjustQuantity" label="调整数量" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="正数增加，负数减少" />
          </Form.Item>
          <Form.Item name="reason" label="调整原因">
            <Select options={[{ label: '盘点调整', value: '盘点调整' }, { label: '报损', value: '报损' }, { label: '其他', value: '其他' }]} placeholder="请选择原因" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
