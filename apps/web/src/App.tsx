import { ReactNode } from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import { AppLayout } from "./layout/AppLayout";
import { useAuth } from "./auth/AuthContext";

import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { InventoryPage } from "./pages/InventoryPage";
import { SalesPage } from "./pages/SalesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UsersPage } from "./pages/UsersPage";
import { AuditPage } from "./pages/AuditPage";
import { SellerActivityPage } from "./pages/SellerActivityPage";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedLayout>
              <ProductsPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedLayout>
              <SalesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <InventoryPage />
              </AdminRoute>
            </ProtectedLayout>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <ReportsPage />
              </AdminRoute>
            </ProtectedLayout>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            </ProtectedLayout>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <AuditPage />
              </AdminRoute>
            </ProtectedLayout>
          }
        />

        <Route
          path="/seller-activity"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <SellerActivityPage />
              </AdminRoute>
            </ProtectedLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}