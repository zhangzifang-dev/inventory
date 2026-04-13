import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useUserStore } from '@/stores/useUserStore';
import MainLayout from '@/components/Layout';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Login = lazy(() => import('@/pages/Login'));
const Products = lazy(() => import('@/pages/Products'));
const Categories = lazy(() => import('@/pages/Categories'));
const Suppliers = lazy(() => import('@/pages/Suppliers'));
const Customers = lazy(() => import('@/pages/Customers'));
const PurchaseOrders = lazy(() => import('@/pages/PurchaseOrders'));
const SalesOrders = lazy(() => import('@/pages/SalesOrders'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Users = lazy(() => import('@/pages/Users'));

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useUserStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const Router = () => {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="customers" element={<Customers />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="sales-orders" element={<SalesOrders />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default Router;
