import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Card, Switch, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { userApi, roleApi } from '@/services/api';

export default function Users() {
  const [data, setData] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filterForm] = Form.useForm();
  const [filterCount, setFilterCount] = useState(0);

  useEffect(() => { loadData(); loadRoles(); }, []);

  const loadData = async (page = 1, pageSize = 10, filters?: { username?: string; name?: string; status?: string }) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters?.username) params.username = filters.username;
      if (filters?.name) params.name = filters.name;
      if (filters?.status !== undefined && filters?.status !== 'all') params.status = filters.status === 'enabled';
      const res = await userApi.list(params);
      setData(res.data?.list || []);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: res.data?.total || 0 }));
    } finally { setLoading(false); }
  };

  const loadRoles = async () => { const res = await roleApi.list({ pageSize: 100 }); setRoles(res.data?.list || []); };

  const handleSearch = () => {
    const values = filterForm.getFieldsValue();
    const count = Object.values(values).filter((v: any) => v !== undefined && v !== '' && v !== 'all').length;
    setFilterCount(count);
    loadData(1, pagination.pageSize, values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => { setEditingId(null); form.resetFields(); form.setFieldsValue({ status: true }); setModalVisible(true); };
  const handleEdit = (record: any) => { setEditingId(record.id); form.setFieldsValue({ ...record, roleIds: record.roles?.map((r: any) => r.id) }); setModalVisible(true); };
  const handleDelete = async (id: number) => { await userApi.delete(id); message.success('删除成功'); handleSearch(); };
  
  const handleSubmit = async () => {
    const values = await form.validateFields();
    const submitData = { ...values, roleIds: values.roleIds ? [values.roleIds] : [] };
    if (editingId) { await userApi.update(editingId, submitData); message.success('更新成功'); }
    else { await userApi.create(submitData); message.success('创建成功'); }
    setModalVisible(false); handleSearch();
  };

  const columns = [
    { title: '#', key: 'index', width: 60, render: (_: any, __: any, index: number) => (pagination.current - 1) * pagination.pageSize + index + 1 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '角色', dataIndex: 'roles', key: 'roles', render: (roles: any[]) => roles?.map(r => r.name).join(', ') },
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
      extra={
        <Space>
          <Form form={filterForm} layout="inline" style={{ gap: 8 }}>
            <Form.Item name="username">
              <Input placeholder="用户名" allowClear style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="name">
              <Input placeholder="姓名" allowClear style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="status" initialValue="all">
              <Select style={{ width: 80 }} options={[{ label: '全部', value: 'all' }, { label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }]} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询{filterCount > 0 && <Badge count={filterCount} style={{ marginLeft: 4 }} />}</Button>
            </Form.Item>
          </Form>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增用户</Button>
        </Space>
      }
    >
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, onChange: (page, pageSize) => loadData(page, pageSize, filterForm.getFieldsValue()) }} />
      <Modal title={editingId ? '编辑用户' : '新增用户'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input disabled={!!editingId} /></Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          {!editingId && <Form.Item name="password" label="密码" rules={[{ required: !editingId }]}><Input.Password /></Form.Item>}
          <Form.Item name="roleIds" label="角色"><Select options={roles.map(r => ({ label: r.name, value: r.id }))} placeholder="请选择角色" /></Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked"><Switch checkedChildren="启用" unCheckedChildren="禁用" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
