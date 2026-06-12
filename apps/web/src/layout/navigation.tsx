import { type ReactElement } from "react";

import AssessmentIcon from "@mui/icons-material/Assessment";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import PeopleIcon from "@mui/icons-material/People";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import WarehouseIcon from "@mui/icons-material/Warehouse";

import { PERMISSIONS, type Permission } from "../auth/permissions";

type CanAccess = (permission: Permission) => boolean;

export type NavigationItem = {
  label: string;
  description: string;
  to: string;
  icon: ReactElement;
  visible: boolean;
};

export type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

export function buildPrimaryNavigationAction(
  can: CanAccess,
): NavigationItem | null {
  if (!can(PERMISSIONS.SalesCreate) || !can(PERMISSIONS.SalesRead)) {
    return null;
  }

  return {
    label: "Ventas",
    description: "Registrar venta",
    to: "/sales",
    icon: <PointOfSaleIcon />,
    visible: true,
  };
}

export function buildNavigationSections(can: CanAccess): NavigationSection[] {
  return [
    {
      label: "Operación",
      items: [
        {
          label: "Inicio",
          description: "Resumen operativo",
          to: "/",
          icon: <DashboardIcon />,
          visible: can(PERMISSIONS.DashboardRead),
        },
        {
          label: "Productos",
          description: "Gestionar catálogo",
          to: "/products",
          icon: <CategoryIcon />,
          visible: can(PERMISSIONS.ProductsRead),
        },
        {
          label: "Inventario",
          description: "Revisar existencias",
          to: "/inventory",
          icon: <WarehouseIcon />,
          visible: can(PERMISSIONS.InventoryRead),
        },
      ],
    },
    {
      label: "Administración",
      items: [
        {
          label: "Usuarios",
          description: "Gestionar accesos",
          to: "/users",
          icon: <PeopleIcon />,
          visible: can(PERMISSIONS.UsersRead),
        },
        {
          label: "Actividad de vendedores",
          description: "Supervisar actividad",
          to: "/seller-activity",
          icon: <ManageSearchIcon />,
          visible: can(PERMISSIONS.SellerActivityRead),
        },
      ],
    },
    {
      label: "Control",
      items: [
        {
          label: "Reportes",
          description: "Analizar resultados",
          to: "/reports",
          icon: <AssessmentIcon />,
          visible: can(PERMISSIONS.ReportsRead),
        },
        {
          label: "Auditoría",
          description: "Revisar actividad",
          to: "/audit",
          icon: <HistoryIcon />,
          visible: can(PERMISSIONS.AuditRead),
        },
      ],
    },
  ];
}

export function getVisibleNavigationSections(
  sections: NavigationSection[],
): NavigationSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.visible),
    }))
    .filter((section) => section.items.length > 0);
}

export function flattenNavigationSections(
  sections: NavigationSection[],
): NavigationItem[] {
  return sections.flatMap((section) => section.items);
}

const MOBILE_NAVIGATION_PRIORITY = [
  "/sales",
  "/",
  "/products",
  "/inventory",
  "/reports",
] as const;

export function buildMobileNavigationItems({
  primaryAction,
  sections,
}: {
  primaryAction: NavigationItem | null;
  sections: NavigationSection[];
}): NavigationItem[] {
  const items = [
    ...(primaryAction ? [primaryAction] : []),
    ...flattenNavigationSections(sections),
  ];
  const itemsByPath = new Map(items.map((item) => [item.to, item]));

  return MOBILE_NAVIGATION_PRIORITY.flatMap((path) => {
    const item = itemsByPath.get(path);

    return item ? [item] : [];
  });
}

export function isNavigationRouteActive(pathname: string, itemPath: string) {
  if (itemPath === "/") {
    return pathname === "/";
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}
