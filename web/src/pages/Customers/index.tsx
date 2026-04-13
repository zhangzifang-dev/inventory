import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Card, Switch, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { customerApi } from '@/services/api';

export default function Customers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filterForm] = Form.useForm();
  const [filterCount, setFilterCount] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async (page = 1, pageSize = 10, filters?: { name?: string; phone?: string; status?: string }) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters?.name) params.name = filters.name;
      if (filters?.phone) params.phone = filters.phone;
      if (filters?.status !== undefined && filters?.status !== 'all') params.status = filters.status === 'enabled';
      const res = await customerApi.list(params);
      setData(res.data?.list || []);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: res.data?.total || 0 }));
    } finally { setLoading(false); }
  };

  const handleSearch = () => {
    const values = filterForm.getFieldsValue();
    const count = Object.values(values).filter((v: any) => v !== undefined && v !== '' && v !== 'all').length;
    setFilterCount(count);
    loadData(1, pagination.pageSize, values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => { setEditingId(null); form.resetFields(); form.setFieldsValue({ status: true }); setModalVisible(true); };
  const handleEdit = (record: any) => { setEditingId(record.id); form.setFieldsValue(record); setModalVisible(true); };
  const handleDelete = async (id: number) => { await customerApi.delete(id); message.success('删除成功'); handleSearch(); };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) { await customerApi.update(editingId, values); message.success('更新成功'); }
    else { await customerApi.create(values); message.success('创建成功'); }
    setModalVisible(false); handleSearch();
  };

  const columns = [
    { title: '#', key: 'index', width: 60, render: (_: any, __: any, index: number) => (pagination.current - 1) * pagination.pageSize + index + 1 },
    { title: '客户名称', dataIndex: 'name', key: 'name' },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '累计金额', dataIndex: 'totalAmount', key: 'totalAmount', width: 120, render: (v: number) => `¥${Number(v).toLocaleString()}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: boolean) => v ? '启用' : '禁用' },
    { title: '操作', key: 'action', width: 150, render: (_: any, record: any) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
      </Space>
    )},
  ];

  return (
    <Card 
      title={
        <Space>
          <span>客户管理</span>
          {filterCount > 0 && <Badge count={filterCount} style={{ backgroundColor: '#1890ff' }} />}
        </Space>
      } 
      extra={
        <Space>
          <Form form={filterForm} layout="inline" style={{ gap: 8 }}>
            <Form.Item name="name">
              <Input placeholder="名称" allowClear style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="phone">
              <Input placeholder="电话" allowClear style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="status" initialValue="all">
              <Select style={{ width: 80 }} options={[{ label: '全部', value: 'all' }, { label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }]} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
            </Form.Item>
          </Form>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增客户</Button>
        </Space>
      }
    >
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, onChange: (page, pageSize) => loadData(page, pageSize, filterForm.getFieldsValue()) }} />
      <Modal title={editingId ? '编辑客户' : '新增客户'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="客户名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="电话"><Input /></Form.Item>
          <Form.Item name="address" label="地址"><Input /></Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked"><Switch checkedChildren="启用" unCheckedChildren="禁用" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
