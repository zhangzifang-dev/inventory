import { useEffect, useState } from 'react';
import { Table, Button, Modal, Card, Tag, Descriptions, Badge, Form, Input, Select, message, InputNumber, Space, Divider, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { salesOrderApi, customerApi, productApi, inventoryApi } from '@/services/api';

export default function SalesOrders() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Map<number, number>>(new Map());
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filterForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [filterCount, setFilterCount] = useState(0);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); loadCustomers(); loadProducts(); }, []);

  const loadData = async (page = 1, pageSize = 10, filters?: { orderNo?: string; customerId?: number; status?: string }) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters?.orderNo) params.orderNo = filters.orderNo;
      if (filters?.customerId) params.customerId = filters.customerId;
      if (filters?.status && filters?.status !== 'all') params.status = filters.status;
      const res = await salesOrderApi.list(params);
      setData(res.data?.list || []);
      setPagination(prev => ({ ...prev, current: page, pageSize, total: res.data?.total || 0 }));
    } finally { setLoading(false); }
  };

  const loadCustomers = async () => { const res = await customerApi.list({ pageSize: 100 }); setCustomers(res.data?.list || []); };
  
  const loadProducts = async () => { 
    const res = await productApi.list({ pageSize: 100, status: true }); 
    setProducts(res.data?.list || []);
    const invRes = await inventoryApi.list({ pageSize: 1000 });
    const map = new Map<number, number>();
    (invRes.data?.list || []).forEach((inv: any) => {
      map.set(inv.productId, inv.quantity);
    });
    setInventoryMap(map);
  };

  const handleSearch = () => {
    const values = filterForm.getFieldsValue();
    const count = Object.values(values).filter((v: any) => v !== undefined && v !== '' && v !== 'all').length;
    setFilterCount(count);
    loadData(1, pagination.pageSize, values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleView = async (id: number) => { const res = await salesOrderApi.get(id); setCurrentOrder(res.data); setDetailVisible(true); };

  const handleComplete = async (id: number) => {
    try {
      await salesOrderApi.updateStatus(id, 'completed');
      message.success('订单已完成');
      loadData(pagination.current, pagination.pageSize, filterForm.getFieldsValue());
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const handleCreate = () => {
    createForm.resetFields();
    setOrderItems([]);
    setCreateVisible(true);
  };

  const handleAddItem = () => {
    const newItems = [...orderItems, { productId: undefined, quantity: 1, unitPrice: 0, discountRate: 0, key: Date.now() }];
    setOrderItems(newItems);
  };

  const handleRemoveItem = (key: number) => {
    setOrderItems(orderItems.filter(item => item.key !== key));
  };

  const handleItemChange = (key: number, field: string, value: any) => {
    const newItems = orderItems.map(item => {
      if (item.key === key) {
        const updated = { ...item, [field]: value };
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          if (product) {
            updated.unitPrice = product.salePrice;
          }
        }
        return updated;
      }
      return item;
    });
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    let total = 0;
    orderItems.forEach(item => {
      total += (item.quantity || 0) * (item.unitPrice || 0) * (1 - (item.discountRate || 0) / 100);
    });
    return total;
  };

  const handleSubmit = async (status: 'draft' | 'pending') => {
    if (!createForm.getFieldValue('customerId')) {
      message.error('请选择客户');
      return;
    }
    if (orderItems.length === 0) {
      message.error('请添加商品');
      return;
    }
    for (const item of orderItems) {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        message.error('请完善商品信息');
        return;
      }
      const stock = inventoryMap.get(item.productId) || 0;
      if (item.quantity > stock) {
        const product = products.find(p => p.id === item.productId);
        message.error(`商品"${product?.name}"库存不足，当前库存: ${stock}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const dto = {
        customerId: createForm.getFieldValue('customerId'),
        status,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountRate: item.discountRate || 0,
        })),
      };
      await salesOrderApi.create(dto);
      message.success(status === 'draft' ? '订单已保存为草稿' : '订单已提交审批');
      setCreateVisible(false);
      handleSearch();
    } catch (error) {
      console.error('Failed to create order:', error);
    } finally {
      setSubmitting(false);
    }
  };

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
    { title: '操作', key: 'action', width: 160, render: (_: any, record: any) => (
      <Space>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record.id)}>查看</Button>
        {(record.status === 'draft' || record.status === 'pending') && (
          <Popconfirm title="确定完成订单？库存将自动扣减。" onConfirm={() => handleComplete(record.id)}>
            <Button type="link" size="small">完成</Button>
          </Popconfirm>
        )}
      </Space>
    )},
  ];

  return (
    <Card 
      extra={
        <Space>
          <Form form={filterForm} layout="inline" style={{ gap: 8 }}>
            <Form.Item name="orderNo">
              <Input placeholder="订单号" allowClear style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="customerId">
              <Select placeholder="客户" allowClear style={{ width: 120 }} options={customers.map(c => ({ label: c.name, value: c.id }))} />
            </Form.Item>
            <Form.Item name="status" initialValue="all">
              <Select style={{ width: 90 }} options={[
                { label: '全部', value: 'all' },
                { label: '草稿', value: 'draft' },
                { label: '待审批', value: 'pending' },
                { label: '已完成', value: 'completed' },
                { label: '已取消', value: 'cancelled' },
              ]} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询{filterCount > 0 && <Badge count={filterCount} style={{ marginLeft: 4 }} />}</Button>
            </Form.Item>
          </Form>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增销售</Button>
        </Space>
      }
    >
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ ...pagination, onChange: (page, pageSize) => loadData(page, pageSize, filterForm.getFieldsValue()) }} />
      <Modal title="销售订单详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={900}>
        {currentOrder && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="订单号">{currentOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="客户">{currentOrder.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{Number(currentOrder.totalAmount).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="折扣">¥{Number(currentOrder.discountAmount).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="实付金额">¥{Number(currentOrder.finalAmount).toLocaleString()}</Descriptions.Item>
            </Descriptions>
            <Divider>商品明细</Divider>
            <Table
              size="small"
              pagination={false}
              dataSource={currentOrder.items || []}
              rowKey="id"
              scroll={{ y: 300 }}
              columns={[
                { title: '商品名称', dataIndex: ['product', 'name'], key: 'name' },
                { title: '规格', dataIndex: ['product', 'spec'], key: 'spec', render: (v: string) => v || '-' },
                { title: '单位', dataIndex: ['product', 'unit'], key: 'unit', width: 60, render: (v: string) => v || '-' },
                { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 60 },
                { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 80, render: (v: number) => `¥${Number(v).toFixed(2)}` },
                { title: '折扣率', dataIndex: 'discountRate', key: 'discountRate', width: 70, render: (v: number) => v ? `${v}%` : '-' },
                { title: '折扣金额', dataIndex: 'discountAmount', key: 'discountAmount', width: 80, render: (v: number) => v ? `¥${Number(v).toFixed(2)}` : '-' },
                { title: '小计', dataIndex: 'amount', key: 'amount', width: 90, render: (v: number) => `¥${Number(v).toFixed(2)}` },
              ]}
            />
          </>
        )}
      </Modal>
      <Modal title="新增销售订单" open={createVisible} onCancel={() => setCreateVisible(false)} width={800} footer={null}>
        <Form form={createForm} layout="vertical">
          <Form.Item name="customerId" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
            <Select placeholder="请选择客户" options={customers.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Divider>商品列表</Divider>
          {orderItems.map((item) => {
            const stock = item.productId ? inventoryMap.get(item.productId) : undefined;
            const isLowStock = stock !== undefined && item.quantity > stock;
            return (
              <div key={item.key} style={{ marginBottom: 16, padding: 12, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Select
                    placeholder="选择商品"
                    style={{ width: 200 }}
                    value={item.productId}
                    onChange={(v) => handleItemChange(item.key, 'productId', v)}
                    options={products.map(p => ({ 
                      label: `${p.name} (库存: ${inventoryMap.get(p.id) || 0})`, 
                      value: p.id 
                    }))}
                  />
                  <InputNumber
                    placeholder="数量"
                    min={1}
                    value={item.quantity}
                    onChange={(v) => handleItemChange(item.key, 'quantity', v)}
                    style={{ width: 80 }}
                    status={isLowStock ? 'error' : undefined}
                  />
                  <InputNumber
                    placeholder="单价"
                    min={0}
                    precision={2}
                    value={item.unitPrice}
                    onChange={(v) => handleItemChange(item.key, 'unitPrice', v)}
                    style={{ width: 100 }}
                  />
                  <InputNumber
                    placeholder="折扣%"
                    min={0}
                    max={100}
                    value={item.discountRate}
                    onChange={(v) => handleItemChange(item.key, 'discountRate', v)}
                    style={{ width: 80 }}
                    addonAfter="%"
                  />
                  <span>小计: ¥{((item.quantity || 0) * (item.unitPrice || 0) * (1 - (item.discountRate || 0) / 100)).toFixed(2)}</span>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveItem(item.key)} />
                </Space>
                {isLowStock && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>库存不足，当前库存: {stock}</div>}
              </div>
            );
          })}
          <Button type="dashed" onClick={handleAddItem} style={{ width: '100%' }}>+ 添加商品</Button>
          <Divider />
          <div style={{ textAlign: 'right', fontSize: 16, marginBottom: 16 }}>
            <span>合计: </span>
            <span style={{ fontWeight: 600, color: '#1890ff' }}>¥{calculateTotal().toFixed(2)}</span>
          </div>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setCreateVisible(false)}>取消</Button>
            <Button onClick={() => handleSubmit('draft')} loading={submitting}>保存草稿</Button>
            <Button type="primary" onClick={() => handleSubmit('pending')} loading={submitting}>提交审批</Button>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
