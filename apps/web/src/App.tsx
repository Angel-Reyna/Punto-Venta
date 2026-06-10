import {
  lazy,
  ReactNode,
  Suspense
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import {
  Box,
  CircularProgress,
  Typography
} from "@mui/material";

import { AppLayout } from "./layout/AppLayout";
import { useAuth } from "./auth/AuthContext";
import { PERMISSIONS, type Permission } from "./auth/permissions";

const LoginPage = lazy(() =>
  import("./features/auth/LoginPage").then((module) => ({ default: module.LoginPage }))
);
const DashboardPage = lazy(() =>
  import("./features/dashboard/DashboardPage").then((module) => ({ default: module.DashboardPage }))
);
const ProductsPage = lazy(() =>
  import("./features/products/ProductsPage").then((module) => ({ default: module.ProductsPage }))
);
const InventoryPage = lazy(() =>
  import("./features/inventory/InventoryPage").then((module) => ({ default: module.InventoryPage }))
);
const SalesPage = lazy(() =>
  import("./features/sales/SalesPage").then((module) => ({ default: module.SalesPage }))
);
const ReportsPage = lazy(() =>
  import("./features/reports/ReportsPage").then((module) => ({ default: module.ReportsPage }))
);
const UsersPage = lazy(() =>
  import("./features/users/UsersPage").then((module) => ({ default: module.UsersPage }))
);
const AuditPage = lazy(() =>
  import("./features/audit/AuditPage").then((module) => ({ default: module.AuditPage }))
);
const SellerActivityPage = lazy(() =>
  import("./features/seller-activity/SellerActivityPage").then((module) => ({ default: module.SellerActivityPage }))
);
const UiLabPage = lazy(() =>
  import("./features/ui-lab/UiLabPage").then((module) => ({ default: module.UiLabPage }))
);

function FullPageLoader() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        gap: 2
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress />
        <Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">
          Cargando Punta Venta...
        </Typography>
      </Box>
    </Box>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PermissionRoute({
  permission,
  children
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { can } = useAuth();

  if (!can(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{withSuspense(children)}</AppLayout>
    </ProtectedRoute>
  );
}

function withSuspense(children: ReactNode) {
  return <Suspense fallback={<FullPageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={withSuspense(<LoginPage />)} />

        <Route
          path="/"
          element={withSuspense(
            <ProtectedLayout>
              <PermissionRoute permission={PERMISSIONS.DashboardRead}>
                <DashboardPage />
              </PermissionRoute>
            </ProtectedLayout>
          )}
        />

        <Route
          path="/products"
          element={withSuspense(
            <ProtectedLayout>
              <PermissionRoute permission={PERMISSIONS.ProductsRead}>
                <ProductsPage />
              </PermissionRoute>
            </ProtectedLayout>
          )}
        />

        <Route
          path="/sales"
          element={withSuspense(
            <ProtectedLayout>
              <PermissionRoute permission={PERMISSIONS.SalesRead}>
                <SalesPage />
              </PermissionRoute>
            </ProtectedLayout>
          )}
        />

        <Route
          path="/inventory"
          element={withSuspense(
            <ProtectedLayout>
              <PermissionRoute permission={PERMISSIONS.InventoryRead}>
                <InventoryPage />
              </PermissionRoute>
            </ProtectedLayout>
          )}
        />


        <Route
          path="/reports"
          element={withSuspense(
            <ProtectedLayout>
              <PermissionRoute permission={PERMISSIONS.ReportsRead}>
                <ReportsPage />
              </PermissionRoute>
            </ProtectedLayout>
          )}
        />

        <Route
          path="/users"
          element={withSuspense(
            <ProtectedLayout>
              <PermissionRoute permission={PERMISSIONS.UsersRead}>
                <UsersPage />
              </PermissionRoute>
            </ProtectedLayout>
          )}
        />

        <Route
          path="/audit"
          element={withSuspense(
            <ProtectedLayout>
              <PermissionRoute permission={PERMISSIONS.AuditRead}>
                <AuditPage />
              </PermissionRoute>
            </ProtectedLayout>
          )}
        />

        <Route
          path="/seller-activity"
          element={withSuspense(
            <ProtectedLayout>
              <PermissionRoute permission={PERMISSIONS.SellerActivityRead}>
                <SellerActivityPage />
              </PermissionRoute>
            </ProtectedLayout>
          )}
        />

        <Route
          path="/ui-lab"
          element={
            import.meta.env.DEV ? withSuspense(<UiLabPage />) : <Navigate to="/" replace />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
