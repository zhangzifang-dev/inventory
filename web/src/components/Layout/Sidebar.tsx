import { Menu } from 'antd';
import {
  HomeOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  InboxOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
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
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: '工作台',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: '商品管理',
      children: [
        { key: '/products/list', label: '商品列表' },
        { key: '/products/category', label: '商品分类' },
      ],
    },
    {
      key: '/purchase',
      icon: <ShoppingCartOutlined />,
      label: '采购管理',
      children: [
        { key: '/purchase/orders', label: '采购订单' },
        { key: '/purchase/records', label: '采购记录' },
      ],
    },
    {
      key: '/sales',
      icon: <ShopOutlined />,
      label: '销售管理',
      children: [
        { key: '/sales/orders', label: '销售订单' },
        { key: '/sales/records', label: '销售记录' },
      ],
    },
    {
      key: '/inventory',
      icon: <InboxOutlined />,
      label: '库存管理',
      children: [
        { key: '/inventory/stock', label: '库存查询' },
        { key: '/inventory/warning', label: '库存预警' },
      ],
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '报表中心',
      children: [
        { key: '/reports/sales', label: '销售报表' },
        { key: '/reports/purchase', label: '采购报表' },
        { key: '/reports/inventory', label: '库存报表' },
      ],
    },
  ];

  if (isAdmin) {
    menuItems.push(
      {
        key: '/users',
        icon: <UserOutlined />,
        label: '用户管理',
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: '系统设置',
      }
    );
  }

  const handleClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const getOpenKeys = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts.length > 1) {
      return [`/${pathParts[1]}`];
    }
    return [];
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      defaultOpenKeys={getOpenKeys()}
      items={menuItems}
      onClick={handleClick}
      style={{ borderRight: 0 }}
    />
  );
};

export default Sidebar;
