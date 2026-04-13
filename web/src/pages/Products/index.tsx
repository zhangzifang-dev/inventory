import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { productApi, categoryApi } from '@/services/api';

export default function Products() {
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => { loadData(); loadCategories(); }, []);

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await productApi.list({ page, pageSize });
      setData(res.data?.list || []);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: res.data?.total || 0 }));
    } finally { setLoading(false); }
  };

  const loadCategories = async () => {
    const res = await categoryApi.list({ pageSize: 100 });
    setCategories(res.data || []);
  };

  const handleAdd = () => { setEditingId(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (record: any) => { setEditingId(record.id); form.setFieldsValue(record); setModalVisible(true); };
  const handleDelete = async (id: number) => { await productApi.delete(id); message.success('删除成功'); loadData(pagination.current, pagination.pageSize); };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) { await productApi.update(editingId, values); message.success('更新成功'); }
    else { await productApi.create(values); message.success('创建成功'); }
    setModalVisible(false); loadData(pagination.current, pagination.pageSize);
  };

  const columns = [
    { title: '#', key: 'index', width: 60, render: (_: any, __: any, index: number) => (pagination.current - 1) * pagination.pageSize + index + 1 },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 100 },
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '规格', dataIndex: 'spec', key: 'spec', width: 150 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '成本价', dataIndex: 'costPrice', key: 'costPrice', width: 100, render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '售价', dataIndex: 'salePrice', key: 'salePrice', width: 100, render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: boolean) => v ? '启用' : '禁用' },
    { title: '操作', key: 'action', width: 120, render: (_: any, record: any) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
      </Space>
    )},
  ];

  return (
    <Card title="商品管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增商品</Button>}>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, onChange: loadData }} />
      <Modal title={editingId ? '编辑商品' : '新增商品'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="sku" label="SKU" rules={[{ required: true }]}><Input placeholder="请输入SKU" disabled={!!editingId} /></Form.Item>
          <Form.Item name="name" label="商品名称" rules={[{ required: true }]}><Input placeholder="请输入商品名称" /></Form.Item>
          <Form.Item name="categoryId" label="分类" rules={[{ required: true }]}><Select placeholder="请选择分类" options={categories.map(c => ({ label: c.name, value: c.id }))} /></Form.Item>
          <Form.Item name="spec" label="规格"><Input placeholder="请输入规格" /></Form.Item>
          <Form.Item name="unit" label="单位"><Input placeholder="请输入单位" /></Form.Item>
          <Form.Item name="costPrice" label="成本价" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="请输入成本价" /></Form.Item>
          <Form.Item name="salePrice" label="售价" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="请输入售价" /></Form.Item>
          <Form.Item name="barcode" label="条码"><Input placeholder="请输入条码" /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} placeholder="请输入描述" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
