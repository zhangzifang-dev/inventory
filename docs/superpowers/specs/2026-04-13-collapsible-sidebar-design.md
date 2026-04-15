# 侧边导航栏折叠功能设计

## 概述

为侧边导航栏添加折叠/展开功能，折叠时只显示图标，点击图标可导航到对应页面。

## 设计方案

### 1. 使用 Ant Design Layout.Sider

利用 `Layout.Sider` 组件的 `collapsible` 和 `collapsed` 属性实现折叠功能。

### 2. 组件结构

```
Layout
└── Sider (可折叠)
    ├── Trigger (折叠按钮，在顶部Logo区域)
    └── Menu (菜单)
```

### 3. 折叠按钮位置

位于菜单顶部（Logo区域旁边），点击切换折叠/展开状态。

### 4. 状态管理

- 使用 React `useState` 管理 `collapsed` 状态
- 折叠状态可持久化到 localStorage（可选）

### 5. 交互行为

| 状态 | 显示内容 | 宽度 |
|------|---------|------|
| 展开 | 图标 + 文字标签 | 200px |
| 折叠 | 仅图标 | 80px |

折叠时点击图标仍可导航到对应页面（Ant Design 默认支持）。

## 实现步骤

1. 创建 Layout 结构，使用 Sider 包裹 Menu
2. 添加折叠按钮到顶部
3. 管理 collapsed 状态
4. 处理折叠时的样式调整

## 影响文件

- `web/src/components/Layout/Sidebar.tsx` - 主要修改
- `web/src/App.tsx` 或 Layout 组件 - 可能需要调整布局结构
