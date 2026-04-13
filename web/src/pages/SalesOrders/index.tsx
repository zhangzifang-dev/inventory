import { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message, Card, Tag, Descriptions } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { salesOrderApi, customerApi, productApi } from '@/services/api';

export default function SalesOrders() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => { loadData(); loadCustomers(); loadProducts(); }, []);

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await salesOrderApi.list({ page, pageSize });
      setData(res.data?.list || []);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: res.data?.total || 0 }));
    } finally { setLoading(false); }
  };

  const loadCustomers = async () => { const res = await customerApi.list({ pageSize: 100 }); setCustomers(res.data?.list || []); };
  const loadProducts = async () => { const res = await productApi.list({ pageSize: 100 }); setProducts(res.data?.list || []); };

  const handleView = async (id: number) => { const res = await salesOrderApi.get(id); setCurrentOrder(res.data); setDetailVisible(true); };

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      pending: { color: 'orange', text: '待审批' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
    };
    const item = map[status] || { color: 'default', text: status };
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  const columns = [
    { title: '#', key: 'index', width: 60, render: (_: any, __: any, index: number) => (pagination.current - 1) * pagination.pageSize + index + 1 },
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
    { title: '客户', dataIndex: ['customer', 'name'], key: 'customer' },
    { title: '总金额', dataIndex: 'totalAmount', key: 'totalAmount', width: 120, render: (v: number) => `¥${Number(v).toLocaleString()}` },
    { title: '折扣', dataIndex: 'discountAmount', key: 'discountAmount', width: 100, render: (v: number) => v ? `¥${Number(v).toLocaleString()}` : '-' },
    { title: '实付金额', dataIndex: 'finalAmount', key: 'finalAmount', width: 120, render: (v: number) => `¥${Number(v).toLocaleString()}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => getStatusTag(v) },
    { title: '操作', key: 'action', width: 100, render: (_: any, record: any) => (
      <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record.id)}>查看</Button>
    )},
  ];

  return (
    <Card title="销售订单">
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, onChange: loadData }} />
      <Modal title="销售订单详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={700}>
        {currentOrder && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="订单号">{currentOrder.orderNo}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(currentOrder.status)}</Descriptions.Item>
            <Descriptions.Item label="客户">{currentOrder.customer?.name}</Descriptions.Item>
            <Descriptions.Item label="总金额">¥{Number(currentOrder.totalAmount).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="折扣">¥{Number(currentOrder.discountAmount).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="实付金额">¥{Number(currentOrder.finalAmount).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  );
}
