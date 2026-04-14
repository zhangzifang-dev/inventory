import { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Radio, DatePicker, Select, Empty } from 'antd';
import { ShoppingOutlined, TeamOutlined, UserSwitchOutlined, InboxOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import dayjs from 'dayjs';
import { productApi, supplierApi, customerApi, purchaseOrderApi, salesOrderApi, inventoryApi, reportApi } from '@/services/api';

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
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);
  const [purchaseStatus, setPurchaseStatus] = useState<string[]>([]);
  const [salesStatus, setSalesStatus] = useState<string[]>([]);
  const [purchaseChartData, setPurchaseChartData] = useState<any[]>([]);
  const [salesChartData, setSalesChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

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
        lowStock: lowStockRes.data?.length || 0,
      });
      setPurchaseOrders(purchaseRes.data?.list || []);
      setSalesOrders(salesRes.data?.list || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    setChartLoading(true);
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        groupBy,
        status: purchaseStatus.length > 0 ? purchaseStatus.join(',') : undefined,
      };
      const salesParams = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        groupBy,
        status: salesStatus.length > 0 ? salesStatus.join(',') : undefined,
      };

      const [purchaseRes, salesRes] = await Promise.all([
        reportApi.purchase(params),
        reportApi.sales(salesParams),
      ]);

      setPurchaseChartData(purchaseRes.data?.byDate || []);
      setSalesChartData(salesRes.data?.byDate || []);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      loadChartData();
    }
  }, [groupBy, dateRange, purchaseStatus, salesStatus]);

  const chartData = useMemo(() => {
    const purchaseMap = new Map(purchaseChartData.map(item => [item.date, item.amount]));
    const salesMap = new Map(salesChartData.map(item => [item.date, item.amount]));
    const allDates = new Set([...purchaseMap.keys(), ...salesMap.keys()]);
    return Array.from(allDates).sort().map(date => ({
      date,
      purchase: purchaseMap.get(date) || 0,
      sales: salesMap.get(date) || 0,
    }));
  }, [purchaseChartData, salesChartData]);

  const handleGroupByChange = (value: 'day' | 'month') => {
    setGroupBy(value);
    if (value === 'day') {
      setDateRange([dayjs().subtract(29, 'day'), dayjs()]);
    } else {
      setDateRange([dayjs().subtract(29, 'month'), dayjs()]);
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
          <Card bodyStyle={{ padding: '12px 24px' }}><Statistic title="库存预警" value={stats.lowStock} prefix={<InboxOutlined />} valueStyle={{ color: stats.lowStock > 0 ? '#cf1322' : '#3f8600' }} loading={loading} /></Card>
        </Col>
        <Col span={6}>
          <Card bodyStyle={{ padding: '12px 24px' }}><Statistic title="商品总数" value={stats.products} prefix={<ShoppingOutlined />} loading={loading} /></Card>
        </Col>
        <Col span={6}>
          <Card bodyStyle={{ padding: '12px 24px' }}><Statistic title="供应商" value={stats.suppliers} prefix={<TeamOutlined />} loading={loading} /></Card>
        </Col>
        <Col span={6}>
          <Card bodyStyle={{ padding: '12px 24px' }}><Statistic title="客户" value={stats.customers} prefix={<UserSwitchOutlined />} loading={loading} /></Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'nowrap' }}>
          <Radio.Group value={groupBy} onChange={(e) => handleGroupByChange(e.target.value)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Radio.Button value="day">按日</Radio.Button>
            <Radio.Button value="month">按月</Radio.Button>
          </Radio.Group>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            picker={groupBy === 'month' ? 'month' : 'date'}
            style={{ width: 240, flexShrink: 0 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ marginRight: 6, whiteSpace: 'nowrap' }}>采购状态:</span>
            <Select
              mode="multiple"
              allowClear
              style={{ width: 120 }}
              placeholder="全部"
              value={purchaseStatus}
              onChange={setPurchaseStatus}
              options={[
                { label: '草稿', value: 'draft' },
                { label: '待审批', value: 'pending' },
                { label: '已审批', value: 'approved' },
                { label: '已完成', value: 'completed' },
                { label: '已取消', value: 'cancelled' },
              ]}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ marginRight: 6, whiteSpace: 'nowrap' }}>销售状态:</span>
            <Select
              mode="multiple"
              allowClear
              style={{ width: 120 }}
              placeholder="全部"
              value={salesStatus}
              onChange={setSalesStatus}
              options={[
                { label: '草稿', value: 'draft' },
                { label: '待审批', value: 'pending' },
                { label: '已完成', value: 'completed' },
                { label: '已取消', value: 'cancelled' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 24 }} loading={chartLoading}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => value !== undefined ? `¥${Number(value).toLocaleString()}` : ''} />
              <Legend />
              <Bar dataKey="purchase" fill="#1890ff" name="采购金额" />
              <Bar dataKey="sales" fill="#52c41a" name="销售金额" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="暂无数据" style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />
        )}
      </Card>

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
