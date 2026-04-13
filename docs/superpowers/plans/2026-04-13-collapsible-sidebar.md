# 侧边导航栏折叠功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为侧边导航栏添加折叠/展开功能，折叠时只显示图标，点击图标可导航。

**Architecture:** 使用 Ant Design Layout.Sider 的 collapsible 属性，在 Logo 区域添加折叠按钮，React state 管理 collapsed 状态。

**Tech Stack:** React + Ant Design + TypeScript

---

### Task 1: 修改 Layout 组件添加折叠功能

**Files:**
- Modify: `web/src/components/Layout/index.tsx`

- [ ] **Step 1: 添加 collapsed 状态管理和折叠按钮**

修改 `web/src/components/Layout/index.tsx`：

```tsx
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
        collapsedWidth={80}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? 0 : '0 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {!collapsed && (
            <span style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>
              进销存系统
            </span>
          )}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 40,
              height: 40,
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
```

- [ ] **Step 2: 修改 Sidebar 组件支持折叠状态**

修改 `web/src/components/Layout/Sidebar.tsx`：

```tsx
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

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar = ({ collapsed }: SidebarProps) => {
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
    <Menu
      mode="inline"
      inlineCollapsed={collapsed}
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleClick}
      style={{ borderRight: 0 }}
    />
  );
};

export default Sidebar;
```

- [ ] **Step 3: 测试验证**

在浏览器中访问 http://192.168.1.13:3000，验证：
1. 点击折叠按钮，侧边栏宽度变为 80px
2. 折叠后只显示图标，不显示文字
3. 点击图标可以导航到对应页面
4. 点击展开按钮恢复正常

- [ ] **Step 4: 提交代码**

```bash
git add web/src/components/Layout/index.tsx web/src/components/Layout/Sidebar.tsx
git commit -m "feat: 侧边导航栏添加折叠功能"
```
