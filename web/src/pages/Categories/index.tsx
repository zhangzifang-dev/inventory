import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { categoryApi } from '@/services/api';

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  sort: number;
  createdAt: string;
  children?: Category[];
}

export default function Categories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { loadData(); }, []);

  const cleanEmptyChildren = (items: Category[]): Category[] => {
    return items.map(item => {
      const cleaned = { ...item };
      if (cleaned.children && cleaned.children.length > 0) {
        cleaned.children = cleanEmptyChildren(cleaned.children);
      } else {
        delete cleaned.children;
      }
      return cleaned;
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await categoryApi.list();
      const cleanedData = cleanEmptyChildren(res.data || []);
      setData(cleanedData);
    } finally { setLoading(false); }
  };

  const handleAdd = () => { setEditingId(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (record: Category) => { setEditingId(record.id); form.setFieldsValue(record); setModalVisible(true); };
  const handleDelete = async (id: number) => { await categoryApi.delete(id); message.success('删除成功'); loadData(); };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) { await categoryApi.update(editingId, values); message.success('更新成功'); }
    else { await categoryApi.create(values); message.success('创建成功'); }
    setModalVisible(false); loadData();
  };

  const getRowClassName = (record: Category): string => {
    return record.parentId === null ? 'parent-category-row' : 'child-category-row';
  };

  const columns = [
    { title: '', key: 'expand', width: 10 },
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '分类名称', dataIndex: 'name', key: 'name' },
    { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (v: string) => new Date(v).toLocaleString() },
    { title: '操作', key: 'action', width: 150, render: (_: any, record: Category) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
      </Space>
    )},
  ];

  return (
    <div className="category-page">
      <style>{`
        .category-page .parent-category-row td {
          background-color: #ffffff !important;
          font-weight: 600;
        }
        .category-page .parent-category-row:hover td {
          background-color: #fafafa !important;
        }
        .category-page .child-category-row td {
          background-color: #f5f5f5 !important;
        }
        .category-page .child-category-row:hover td {
          background-color: #e8e8e8 !important;
        }
      `}</style>
      <Card title="分类管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增分类</Button>}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading} 
          pagination={false}
          indentSize={0}
          defaultExpandAllRows
          rowClassName={getRowClassName}
        />
        <Modal title={editingId ? '编辑分类' : '新增分类'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)}>
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="分类名称" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="sort" label="排序"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
}
