import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Card, Tag, Descriptions } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { purchaseOrderApi, supplierApi, productApi } from '@/services/api';

export default function PurchaseOrders() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => { loadData(); loadSuppliers(); loadProducts(); }, []);

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await purchaseOrderApi.list({ page, pageSize });
      setData(res.data?.list || []);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: res.data?.total || 0 }));
    } finally { setLoading(false); }
  };

  const loadSuppliers = async () => { const res = await supplierApi.list({ pageSize: 100 }); setSuppliers(res.data?.list || []); };
  const loadProducts = async () => { const res = await productApi.list({ pageSize: 100 }); setProducts(res.data?.list || []); };

  const handleAdd = () => { form.resetFields(); form.setFieldsValue({ items: [{}] }); setModalVisible(true); };
  const handleView = async (id: number) => { const res = await purchaseOrderApi.get(id); setCurrentOrder(res.data); setDetailVisible(true); };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const items = values.items.map((item: any) => ({ ...item, amount: Number(item.quantity) * Number(item.unitPrice) }));
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.amount, 0);
    await purchaseOrderApi.create({ ...values, items, totalAmount, status: 'draft' });
    message.success('创建成功');
    setModalVisible(false);
    loadData(pagination.current, pagination.pageSize);
  };

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      pending: { color: 'orange', text: '待审批' },
      approved: { color: 'blue', text: '已审批' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
    };
    const item = map[status] || { color: 'default', text: status };
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  const columns = [
    { title: '#', key: 'index', width: 60, render: (_: any, __: any, index: number) => (pagination.current - 1) * pagination.pageSize + index + 1 },
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
    { title: '供应商', dataIndex: ['supplier', 'name'], key: 'supplier' },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', width: 120, render: (v: number) => `¥${Number(v).toLocaleString()}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => getStatusTag(v) },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (v: string) => new Date(v).toLocaleString() },
    { title: '操作', key: 'action', width: 100, render: (_: any, record: any) => (
      <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record.id)}>查看</Button>
    )},
  ];

  return (
    <Card title="采购订单" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增采购</Button>}>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, onChange: loadData }} />
      <Modal title="新增采购订单" open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={800}>
        <Form form={form} layout="vertical">
          <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}>
            <Select options={suppliers.map(s => ({ label: s.name, value: s.id }))} placeholder="请选择供应商" />
          </Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
      <Modal title="采购订单详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={700}>
        {currentOrder && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="订单号">{currentOrder.orderNo}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(currentOrder.status)}</Descriptions.Item>
            <Descriptions.Item label="供应商">{currentOrder.supplier?.name}</Descriptions.Item>
            <Descriptions.Item label="总金额">¥{Number(currentOrder.totalAmount).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{currentOrder.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
}
