import { Menu } from 'antd';
import {
  HomeOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  InboxOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/useUserStore';
import type { MenuProps } from 'antd';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserStore();

  const isAdmin = user?.roles?.some((role) => role.code === 'admin');

  const menuItems: MenuProps['items'] = [
    { key: '/dashboard', icon: <HomeOutlined />, label: '工作台' },
    { key: '/products', icon: <ShoppingOutlined />, label: '商品管理' },
    { key: '/categories', icon: <ShoppingOutlined />, label: '分类管理' },
    { key: '/suppliers', icon: <TeamOutlined />, label: '供应商管理' },
    { key: '/customers', icon: <TeamOutlined />, label: '客户管理' },
    { key: '/purchase-orders', icon: <ShoppingCartOutlined />, label: '采购订单' },
    { key: '/sales-orders', icon: <ShopOutlined />, label: '销售订单' },
    { key: '/inventory', icon: <InboxOutlined />, label: '库存管理' },
  ];

  if (isAdmin) {
    menuItems.push({ key: '/users', icon: <UserOutlined />, label: '用户管理' });
  }

  const handleClick: MenuProps['onClick'] = ({ key }) => { navigate(key); };

  return (
    <Menu mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={handleClick} style={{ borderRight: 0 }} />
  );
};

export default Sidebar;
