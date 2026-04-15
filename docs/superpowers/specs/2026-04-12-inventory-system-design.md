# 进销存管理系统设计文档

## 一、项目概述

### 1.1 项目背景
面向小型批发/零售门店的进销存管理系统，支持多用户登录、多角色权限管理，实现商品、采购、销售、库存、报表等完整业务流程。

### 1.2 目标用户
- 用户规模：10-50人
- 商品数量：1000-10000
- 使用平台：Web端

### 1.3 技术栈
| 层级 | 技术选型 |
|------|----------|
| 前端框架 | React 18 + TypeScript |
| UI组件库 | Ant Design 5.x |
| 状态管理 | Zustand |
| 后端框架 | NestJS + TypeScript |
| ORM | TypeORM |
| 数据库 | MySQL 8.0 |
| 认证方式 | JWT |
| 部署方式 | Docker + Nginx |

---

## 二、系统架构

### 2.1 整体架构

采用经典三层架构，前后端分离的单体应用。

### 2.2 架构特点
- 单体应用，开发效率高
- NestJS模块化设计，代码结构清晰
- 前后端分离，便于独立开发和部署
- RESTful API，接口规范统一

---

## 三、功能模块设计

### 3.1 用户管理模块
- 登录/登出：JWT Token认证
- 用户管理：增删改查用户、重置密码
- 角色管理：定义角色、分配权限

**预设角色：系统管理员、采购员、销售员、库管员、财务**

### 3.2 商品管理模块
- 商品分类：多级分类管理
- 商品信息：商品名称、编码、规格、单位、成本价、售价等
- 商品图片：支持上传商品图片
- 条码管理：支持条形码扫描查询

### 3.3 采购管理模块
- 供应商管理、采购订单、采购退货、采购统计

### 3.4 销售管理模块
- 客户管理、销售订单、销售退货、销售统计

### 3.5 折扣管理模块
- 整单折扣、单品折扣、优惠券/折扣码、客户等级折扣

**折扣计算优先级：单品折扣 → 客户等级折扣 → 整单折扣 → 优惠券**

### 3.6 库存管理模块
- 库存查询、库存盘点、库存调拨、库存流水

### 3.7 报表模块
- 进销存报表、利润报表、商品销售排行

### 3.8 系统设置模块
- 系统参数、操作日志

---

## 四、数据库设计

### 4.1 数据表清单

**用户与权限：** users, roles, permissions, role_permissions, user_roles

**商品相关：** categories, products, product_images

**采购相关：** suppliers, purchase_orders, purchase_order_items, purchase_returns

**销售相关：** customers, sales_orders, sales_order_items, sales_returns

**折扣相关：** discounts, discount_products, coupons, customer_levels

**库存相关：** inventory, inventory_logs, stocktaking_orders

**系统相关：** system_settings, operation_logs

---

## 五、API设计

### 5.1 API规范
RESTful风格，统一响应格式

### 5.2 核心API
- 用户认证：/api/v1/auth/*
- 商品管理：/api/v1/products/*
- 采购管理：/api/v1/purchase-orders/*
- 销售管理：/api/v1/sales-orders/*
- 库存管理：/api/v1/inventory/*
- 折扣管理：/api/v1/discounts/*, /api/v1/coupons/*
- 报表：/api/v1/reports/*

---

## 六、前端设计

### 6.1 页面路由
- / 首页/工作台
- /user/* 用户管理
- /product/* 商品管理
- /purchase/* 采购管理
- /sales/* 销售管理
- /inventory/* 库存管理
- /report/* 报表中心
- /system/* 系统设置

### 6.2 页面布局
左侧菜单 + 顶部导航 + 内容区

---

## 七、项目目录结构

```
inventory/
├── server/          # 后端项目 (NestJS)
├── web/             # 前端项目 (React)
├── docs/            # 文档
└── docker-compose.yml
```

---

## 八、安全设计

- JWT认证（Token 2小时，Refresh Token 7天）
- RBAC权限控制
- bcrypt密码加密
- SQL注入防护、XSS防护
- 接口限流
- 操作日志审计

---

## 九、部署方案

Docker Compose部署：Nginx + Frontend容器 + Backend容器 + MySQL容器

---

## 十、开发计划

- 第一阶段：基础框架（认证、权限）
- 第二阶段：核心业务（商品、采购、销售、库存）
- 第三阶段：扩展功能（折扣、报表、系统设置）
- 第四阶段：优化部署（性能优化、测试、部署）
