import { useEffect, useState } from 'react';
import { Table, Card, Tag, InputNumber, Button, message, Space, Modal, Form, Select } from 'antd';
import { inventoryApi, productApi } from '@/services/api';

export default function Inventory() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustVisible, setAdjustVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await inventoryApi.list({ page, pageSize });
      setData(res.data?.list || []);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: res.data?.total || 0 }));
    } finally { setLoading(false); }
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
    loadData(pagination.current, pagination.pageSize);
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
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180, render: (v: string) => new Date(v).toLocaleString() },
    { title: '操作', key: 'action', width: 100, render: (_: any, record: any) => (
      <Button type="link" size="small" onClick={() => handleAdjust(record)}>调整</Button>
    )},
  ];

  return (
    <Card title="库存管理">
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, onChange: loadData }} />
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
