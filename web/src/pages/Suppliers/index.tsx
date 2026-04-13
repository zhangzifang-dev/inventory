import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Card, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { supplierApi } from '@/services/api';

export default function Suppliers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await supplierApi.list({ page, pageSize });
      setData(res.data?.list || []);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: res.data?.total || 0 }));
    } finally { setLoading(false); }
  };

  const handleAdd = () => { setEditingId(null); form.resetFields(); form.setFieldsValue({ status: true }); setModalVisible(true); };
  const handleEdit = (record: any) => { setEditingId(record.id); form.setFieldsValue(record); setModalVisible(true); };
  const handleDelete = async (id: number) => { await supplierApi.delete(id); message.success('删除成功'); loadData(pagination.current, pagination.pageSize); };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) { await supplierApi.update(editingId, values); message.success('更新成功'); }
    else { await supplierApi.create(values); message.success('创建成功'); }
    setModalVisible(false); loadData(pagination.current, pagination.pageSize);
  };

  const columns = [
    { title: '#', key: 'index', width: 60, render: (_: any, __: any, index: number) => (pagination.current - 1) * pagination.pageSize + index + 1 },
    { title: '供应商名称', dataIndex: 'name', key: 'name' },
    { title: '联系人', dataIndex: 'contact', key: 'contact', width: 100 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: boolean) => v ? '启用' : '禁用' },
    { title: '操作', key: 'action', width: 150, render: (_: any, record: any) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
      </Space>
    )},
  ];

  return (
    <Card title="供应商管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增供应商</Button>}>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, onChange: loadData }} />
      <Modal title={editingId ? '编辑供应商' : '新增供应商'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="供应商名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contact" label="联系人"><Input /></Form.Item>
          <Form.Item name="phone" label="电话"><Input /></Form.Item>
          <Form.Item name="address" label="地址"><Input /></Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked"><Switch checkedChildren="启用" unCheckedChildren="禁用" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
