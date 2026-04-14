import { Layout, Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/useUserStore';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

const titleMap: Record<string, string> = {
  '/dashboard': '工作台',
  '/products': '商品管理',
  '/categories': '分类管理',
  '/suppliers': '供应商管理',
  '/customers': '客户管理',
  '/purchase-orders': '采购订单',
  '/sales-orders': '销售订单',
  '/inventory': '库存管理',
  '/users': '用户管理',
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const items: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const title = titleMap[location.pathname] || '进销存管理系统';

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: 'linear-gradient(90deg, #1890ff 0%, #40a9ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        height: 28,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
        {title}
      </span>
      <Dropdown menu={{ items }} placement="bottomRight">
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Avatar icon={<UserOutlined />} style={{ marginRight: 8, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
          <span style={{ color: '#fff' }}>{user?.name || '用户'}</span>
        </div>
      </Dropdown>
    </AntHeader>
  );
};

export default Header;
