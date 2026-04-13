import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { ShoppingCartOutlined, DollarOutlined, UserOutlined, InboxOutlined } from '@ant-design/icons';
import { productApi, supplierApi, customerApi, purchaseOrderApi, salesOrderApi, inventoryApi } from '@/services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    suppliers: 0,
    customers: 0,
    lowStock: 0,
  });
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, suppliersRes, customersRes, purchaseRes, salesRes, lowStockRes] = await Promise.all([
        productApi.list({ pageSize: 1 }),
        supplierApi.list({ pageSize: 1 }),
        customerApi.list({ pageSize: 1 }),
        purchaseOrderApi.list({ pageSize: 5 }),
        salesOrderApi.list({ pageSize: 5 }),
        inventoryApi.lowStock({ pageSize: 1 }),
      ]);

      setStats({
        products: productsRes.data?.total || 0,
        suppliers: suppliersRes.data?.total || 0,
        customers: customersRes.data?.total || 0,
        lowStock: lowStockRes.data?.total || 0,
      });
      setPurchaseOrders(purchaseRes.data?.list || []);
      setSalesOrders(salesRes.data?.list || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      pending: { color: 'orange', text: '待审批' },
      approved: { color: 'blue', text: '已审批' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
    };
    const item = statusMap[status] || { color: 'default', text: status };
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  const orderColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `¥${Number(v).toLocaleString()}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => getStatusTag(v) },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => new Date(v).toLocaleString() },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="商品总数" value={stats.products} prefix={<InboxOutlined />} loading={loading} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="供应商" value={stats.suppliers} prefix={<UserOutlined />} loading={loading} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="客户" value={stats.customers} prefix={<UserOutlined />} loading={loading} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="库存预警" value={stats.lowStock} prefix={<ShoppingCartOutlined />} valueStyle={{ color: stats.lowStock > 0 ? '#cf1322' : '#3f8600' }} loading={loading} /></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近采购订单" loading={loading}>
            <Table columns={orderColumns} dataSource={purchaseOrders} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近销售订单" loading={loading}>
            <Table columns={orderColumns} dataSource={salesOrders} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
