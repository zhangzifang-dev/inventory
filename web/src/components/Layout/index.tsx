import { Layout, Button } from 'antd';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import Header from './Header';
import Sidebar from './Sidebar';

const { Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        collapsedWidth={60}
        style={{
          background: '#fff',
        }}
      >
        <div
          style={{
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? 0 : '0 16px',
            background: 'linear-gradient(90deg, #096dd9 0%, #1890ff 100%)',
          }}
        >
          {!collapsed && (
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
              进销存系统
            </span>
          )}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '14px',
              width: 28,
              height: 28,
              color: '#fff',
            }}
          />
        </div>
        <Sidebar collapsed={collapsed} />
      </Sider>
      <Layout>
        <Header />
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
