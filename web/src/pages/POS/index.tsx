import { useEffect, useState, useRef } from 'react';
import { Card, Row, Col, Select, Input, Table, Button, InputNumber, message, Space, Tag } from 'antd';
import { ScanOutlined, PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { productApi, customerApi, salesOrderApi } from '@/services/api';

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  stock: number;
}

export default function POS() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    loadCustomers();
    loadProducts();
    inputRef.current?.focus();
  }, []);

  const loadCustomers = async () => {
    const res = await customerApi.list({ pageSize: 1000 });
    setCustomers(res.data?.list || []);
  };

  const loadProducts = async () => {
    const res = await productApi.list({ pageSize: 1000, status: true });
    setProducts(res.data?.list || []);
  };

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchKeyword))
  );

  const handleScanOrSearch = (value: string) => {
    if (!value.trim()) return;
    
    const matchedProduct = products.find((p: any) =>
      p.barcode === value || p.sku === value || p.name.toLowerCase().includes(value.toLowerCase())
    );

    if (matchedProduct) {
      addToOrder(matchedProduct);
      setSearchKeyword('');
      message.success(`已添加: ${matchedProduct.name}`);
    } else {
      message.warning('未找到匹配商品');
    }
  };

  const addToOrder = (product: any) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: Number(product.salePrice),
          stock: product.inventory?.quantity || 0,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(productId);
      return;
    }
    setOrderItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromOrder = (productId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (isDraft: boolean) => {
    if (!selectedCustomerId) {
      message.error('请选择客户');
      return;
    }
    if (orderItems.length === 0) {
      message.error('请添加商品');
      return;
    }

    setLoading(true);
    try {
      const data = {
        customerId: selectedCustomerId,
        status: isDraft ? 'draft' : 'pending',
        items: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };
      await salesOrderApi.create(data);
      message.success(isDraft ? '订单已保存为草稿' : '订单提交成功');
      setOrderItems([]);
      setSelectedCustomerId(null);
      window.location.href = '/sales-orders';
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const productColumns = [
    { 
      title: '', 
      key: 'action', 
      width: 40, 
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => addToOrder(record)} />
      )
    },
    { 
      title: '库存', 
      key: 'stock', 
      width: 50, 
      render: (_: any, record: any) => {
        const qty = record.inventory?.quantity || 0;
        return <Tag color={qty <= 10 ? 'red' : 'green'}>{qty}</Tag>;
      }
    },
    { title: '商品名称', dataIndex: 'name', key: 'name', width: 150, ellipsis: true },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 80 },
    { title: '售价', dataIndex: 'salePrice', key: 'salePrice', width: 80, render: (v: number) => `¥${Number(v).toFixed(2)}` },
  ];

  const orderColumns = [
    { title: '商品', dataIndex: 'productName', key: 'productName' },
    { 
      title: '数量', 
      key: 'quantity', 
      width: 120, 
      render: (_: any, record: OrderItem) => (
        <InputNumber
          min={1}
          max={record.stock}
          value={record.quantity}
          onChange={(v) => updateQuantity(record.productId, v || 1)}
          size="small"
        />
      )
    },
    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 80, render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '小计', key: 'subtotal', width: 100, render: (_: any, record: OrderItem) => `¥${(record.quantity * record.unitPrice).toFixed(2)}` },
    { 
      title: '', 
      key: 'action', 
      width: 50, 
      render: (_: any, record: OrderItem) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => removeFromOrder(record.productId)} />
      )
    },
  ];

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <Card size="small" style={{ marginBottom: 8 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <span>客户:</span>
              <Select
                style={{ width: 200 }}
                placeholder="选择客户"
                showSearch
                optionFilterProp="label"
                options={customers.map((c) => ({ label: c.name, value: c.id }))}
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
              />
            </Space>
          </Col>
          <Col flex="auto">
            <Input
              ref={inputRef}
              placeholder="扫码或输入商品名称/SKU/条码"
              prefix={<ScanOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={() => handleScanOrSearch(searchKeyword)}
              style={{ width: 300 }}
            />
          </Col>
        </Row>
      </Card>

      <div style={{ flex: 1, display: 'flex', gap: 8, overflow: 'hidden' }}>
        <Card title="当前订单" size="small" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Table
              columns={orderColumns}
              dataSource={orderItems}
              rowKey="productId"
              size="small"
              pagination={false}
              scroll={{ y: 'calc(100vh - 320px)' }}
              locale={{ emptyText: '暂无商品' }}
            />
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Col>小计:</Col>
              <Col>¥{totalAmount.toFixed(2)}</Col>
            </Row>
            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Col><strong>应付:</strong></Col>
              <Col><strong style={{ fontSize: 18, color: '#f5222d' }}>¥{totalAmount.toFixed(2)}</strong></Col>
            </Row>
            <Space style={{ width: '100%' }} direction="vertical">
              <Button block onClick={() => handleSubmit(true)} disabled={orderItems.length === 0}>
                保存草稿
              </Button>
              <Button type="primary" block onClick={() => handleSubmit(false)} loading={loading} disabled={orderItems.length === 0}>
                提交订单
              </Button>
            </Space>
          </div>
        </Card>

        <Card title="商品列表" size="small" style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 8 }}>
            <Input
              placeholder="搜索商品"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Table
              columns={productColumns}
              dataSource={filteredProducts}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ y: 'calc(100vh - 260px)' }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
