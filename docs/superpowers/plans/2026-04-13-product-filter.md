# 商品筛选功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为商品管理页面添加折叠式筛选栏，支持按商品名称、SKU编码、商品分类、状态筛选

**Architecture:** 前端使用 Ant Design Collapse 组件实现折叠筛选栏，筛选条件通过 URL 参数传递给现有后端 API

**Tech Stack:** React, TypeScript, Ant Design

---

### Task 1: 添加筛选栏组件

**Files:**
- Modify: `web/src/pages/Products/index.tsx`

- [ ] **Step 1: 添加筛选状态和组件**

修改 `web/src/pages/Products/index.tsx`，在文件顶部添加筛选相关状态，在 Table 上方添加 Collapse 筛选栏：

```tsx
import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Card, Collapse, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DownOutlined } from '@ant-design/icons';
import { productApi, categoryApi } from '@/services/api';

export default function Products() {
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filterForm] = Form.useForm();
  const [activeFilter, setActiveFilter] = useState(false);
  const [filterCount, setFilterCount] = useState(0);

  useEffect(() => { loadData(); loadCategories(); }, []);

  const loadData = async (page = 1, pageSize = 10, filters?: { name?: string; sku?: string; categoryId?: number; status?: string }) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters?.name) params.name = filters.name;
      if (filters?.sku) params.sku = filters.sku;
      if (filters?.categoryId) params.categoryId = filters.categoryId;
      if (filters?.status !== undefined && filters?.status !== 'all') params.status = filters.status === 'enabled';
      const res = await productApi.list(params);
      setData(res.data?.list || []);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: res.data?.total || 0 }));
    } finally { setLoading(false); }
  };

  const loadCategories = async () => {
    const res = await categoryApi.list({ pageSize: 100 });
    setCategories(res.data || []);
  };

  const handleSearch = () => {
    const values = filterForm.getFieldsValue();
    const count = Object.values(values).filter(v => v !== undefined && v !== '' && v !== 'all').length;
    setFilterCount(count);
    setActiveFilter(count > 0);
    loadData(1, pagination.pageSize, values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => { setEditingId(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (record: any) => { setEditingId(record.id); form.setFieldsValue(record); setModalVisible(true); };
  const handleDelete = async (id: number) => { await productApi.delete(id); message.success('删除成功'); handleSearch(); };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) { await productApi.update(editingId, values); message.success('更新成功'); }
    else { await productApi.create(values); message.success('创建成功'); }
    setModalVisible(false); handleSearch();
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

  const filterPanel = (
    <Form form={filterForm} layout="inline" style={{ gap: 16 }}>
      <Form.Item name="name" label="商品名称">
        <Input placeholder="请输入商品名称" allowClear style={{ width: 150 }} />
      </Form.Item>
      <Form.Item name="sku" label="SKU编码">
        <Input placeholder="请输入SKU" allowClear style={{ width: 120 }} />
      </Form.Item>
      <Form.Item name="categoryId" label="商品分类">
        <Select placeholder="全部分类" allowClear style={{ width: 150 }} options={categories.map(c => ({ label: c.name, value: c.id }))} />
      </Form.Item>
      <Form.Item name="status" label="状态" initialValue="all">
        <Select style={{ width: 100 }} options={[{ label: '全部', value: 'all' }, { label: '启用', value: 'enabled' }, { label: '禁用', value: 'disabled' }]} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
      </Form.Item>
    </Form>
  );

  return (
    <Card 
      title={
        <Space>
          <span>商品管理</span>
          {filterCount > 0 && <Badge count={filterCount} style={{ backgroundColor: '#1890ff' }} />}
        </Space>
      } 
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增商品</Button>}
    >
      <Collapse 
        ghost 
        expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 0 : -90} />}
        items={[{ key: '1', label: '筛选条件', children: filterPanel }]}
        style={{ marginBottom: 16 }}
      />
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, onChange: (page, pageSize) => loadData(page, pageSize, filterForm.getFieldsValue()) }} />
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
```

- [ ] **Step 2: 验证编译**

Run: `cd /home/zzf/projects/inventory/web && npm run build`
Expected: 编译成功，无错误

- [ ] **Step 3: 提交代码**

```bash
git add web/src/pages/Products/index.tsx
git commit -m "feat: add collapsible filter panel to Products page"
```

---

### Task 2: 验证功能

- [ ] **Step 1: 启动前后端服务确认功能正常**

访问商品管理页面，测试：
1. 点击"筛选条件"展开筛选栏
2. 输入商品名称、SKU、选择分类和状态
3. 点击"查询"按钮，确认列表正确筛选
4. 确认筛选后标题旁显示筛选条件数量徽标

---

## Self-Review Checklist

- [x] Spec coverage: 所有需求（商品名称、SKU、分类、状态筛选，折叠式布局，仅查询按钮）均已实现
- [x] Placeholder scan: 无 TBD/TODO 占位符
- [x] Type consistency: 类型定义一致
