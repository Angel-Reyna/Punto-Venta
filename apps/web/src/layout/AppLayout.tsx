import { ReactNode, useMemo, useState } from "react";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import StorefrontIcon from "@mui/icons-material/Storefront";

import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import {
  buildMobileNavigationItems,
  buildNavigationSections,
  buildPrimaryNavigationAction,
  flattenNavigationSections,
  getVisibleNavigationSections,
  isNavigationRouteActive,
  type NavigationItem,
} from "./navigation";

const drawerWidth = 272;
const mobileDrawerWidth = "min(88vw, 320px)";
const mobileNavigationHeight = 76;

const ROLE_LABELS = {
  ADMIN: "Administrador",
  CASHIER: "Vendedor",
} as const;

function getDisplayName(name?: string | null) {
  return name?.trim() || "Usuario";
}

function getUserInitials(name?: string | null) {
  const parts = getDisplayName(name).split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function getRoleLabel(role?: keyof typeof ROLE_LABELS | null) {
  return role ? (ROLE_LABELS[role] ?? role) : "Sin rol";
}

function SidebarLink({
  item,
  onNavigate,
}: {
  item: NavigationItem;
  onNavigate: () => void;
}) {
  return (
    <ListItemButton
      component={NavLink}
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      sx={{
        mx: 1.25,
        mb: 0.5,
        minHeight: 56,
        borderRadius: 2.5,
        color: "text.secondary",
        "& .MuiListItemIcon-root": {
          color: "text.secondary",
          minWidth: 40,
        },
        "&:hover": {
          backgroundColor: "action.hover",
          color: "text.primary",
          "& .MuiListItemIcon-root": {
            color: "primary.main",
          },
        },
        "&.active": {
          backgroundColor: "primary.main",
          color: "primary.contrastText",
          boxShadow: "0 12px 24px rgba(37, 99, 235, 0.22)",
          "& .MuiListItemIcon-root": {
            color: "primary.contrastText",
          },
          "&:hover": {
            backgroundColor: "primary.dark",
          },
        },
      }}
    >
      <ListItemIcon>{item.icon}</ListItemIcon>
      <ListItemText
        primary={item.label}
        secondary={item.description}
        primaryTypographyProps={{
          fontWeight: 800,
          fontSize: 14,
          lineHeight: 1.25,
        }}
        secondaryTypographyProps={{
          fontSize: 12,
          lineHeight: 1.25,
          color: "inherit",
          sx: { opacity: 0.72 },
        }}
      />
    </ListItemButton>
  );
}

function MobileBottomNavigation({
  currentPathname,
  items,
}: {
  currentPathname: string;
  items: NavigationItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Paper
      component="nav"
      elevation={10}
      aria-label="Navegación principal móvil"
      sx={{
        position: "fixed",
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: (muiTheme) => muiTheme.zIndex.appBar,
        display: { xs: "block", md: "none" },
        borderTop: "1px solid",
        borderColor: "divider",
        borderRadius: 0,
        backgroundColor: "background.paper",
        pb: "env(safe-area-inset-bottom)",
      }}
    >
      <Box
        sx={{
          minHeight: mobileNavigationHeight,
          display: "grid",
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          alignItems: "stretch",
          px: 0.75,
          py: 0.75,
        }}
      >
        {items.map((item) => {
          const isActive = isNavigationRouteActive(currentPathname, item.to);

          return (
            <Box
              key={item.to}
              component={NavLink}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              sx={{
                minWidth: 0,
                px: 0.5,
                py: 0.75,
                borderRadius: 2.5,
                color: isActive ? "primary.main" : "text.secondary",
                textAlign: "center",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.25,
                WebkitTapHighlightColor: "transparent",
                "& .MuiSvgIcon-root": {
                  fontSize: 22,
                },
                "&:hover": {
                  backgroundColor: "action.hover",
                  color: isActive ? "primary.main" : "text.primary",
                },
                "&.Mui-focusVisible, &:focus-visible": {
                  outline: "3px solid rgba(37, 99, 235, 0.35)",
                  outlineOffset: -2,
                },
              }}
            >
              {item.icon}
              <Typography
                component="span"
                noWrap
                sx={{
                  maxWidth: "100%",
                  fontSize: 11,
                  lineHeight: 1.1,
                  fontWeight: isActive ? 850 : 700,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, can } = useAuth();
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = useState(false);

  const primaryAction = useMemo(() => buildPrimaryNavigationAction(can), [can]);

  const visibleSections = useMemo(
    () => getVisibleNavigationSections(buildNavigationSections(can)),
    [can],
  );

  const visibleItems = useMemo(
    () => [
      ...(primaryAction ? [primaryAction] : []),
      ...flattenNavigationSections(visibleSections),
    ],
    [primaryAction, visibleSections],
  );

  const mobileNavigationItems = useMemo(
    () => buildMobileNavigationItems({ primaryAction, sections: visibleSections }),
    [primaryAction, visibleSections],
  );

  const currentItem = visibleItems.find((item) =>
    isNavigationRouteActive(location.pathname, item.to),
  );

  const displayName = getDisplayName(user?.name);
  const roleLabel = getRoleLabel(user?.role);

  const closeMobileDrawer = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  const drawerContent = (
    <Box
      sx={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ px: 2.25, pt: 2.5, pb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              color: "primary.contrastText",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: "0 14px 28px rgba(37, 99, 235, 0.22)",
            }}
          >
            <StorefrontIcon />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={850} lineHeight={1.1}>
              Punta Venta
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Panel de ventas
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{
            p: 1.25,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              fontWeight: 800,
              bgcolor: "primary.main",
            }}
          >
            {getUserInitials(user?.name)}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Tooltip title={displayName} disableInteractive>
              <Typography noWrap variant="body2" fontWeight={750}>
                {displayName}
              </Typography>
            </Tooltip>
            <Typography variant="caption" color="text.secondary">
              {roleLabel}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {primaryAction && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            component={NavLink}
            to={primaryAction.to}
            fullWidth
            startIcon={primaryAction.icon}
            onClick={closeMobileDrawer}
            sx={{
              justifyContent: "flex-start",
              minHeight: 48,
              px: 1.75,
              borderRadius: 3,
              boxShadow: "0 14px 28px rgba(37, 99, 235, 0.24)",
              "&.active": {
                bgcolor: "primary.dark",
              },
            }}
          >
            <Stack
              spacing={0.1}
              alignItems="flex-start"
              sx={{ lineHeight: 1.1 }}
            >
              <Typography component="span" fontWeight={850} lineHeight={1.1}>
                {primaryAction.label}
              </Typography>
              <Typography
                component="span"
                variant="caption"
                sx={{ opacity: 0.82 }}
              >
                {primaryAction.description}
              </Typography>
            </Stack>
          </Button>
        </Box>
      )}

      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto", py: 1.5 }}>
        {visibleSections.map((section) => (
          <Box key={section.label} sx={{ mb: 1.25 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={850}
              sx={{
                display: "block",
                px: 2.5,
                py: 1,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {section.label}
            </Typography>

            <List disablePadding>
              {section.items.map((item) => (
                <SidebarLink
                  key={item.to}
                  item={item}
                  onNavigate={closeMobileDrawer}
                />
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? open : true}
        onClose={() => setOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          width: isMobile ? mobileDrawerWidth : drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: isMobile ? mobileDrawerWidth : drawerWidth,
            borderRight: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            boxSizing: "border-box",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        sx={{
          flexGrow: 1,
          width: {
            xs: "100%",
            md: `calc(100% - ${drawerWidth}px)`,
          },
          minWidth: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{
            top: 0,
            zIndex: (muiTheme) => muiTheme.zIndex.appBar,
            borderBottom: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(10px)",
            backgroundColor: alpha(theme.palette.background.paper, 0.92),
          }}
        >
          <Toolbar
            sx={{
              minHeight: {
                xs: 60,
                sm: 72,
              },
              px: {
                xs: 1.25,
                sm: 2.5,
                lg: 3,
              },
              gap: {
                xs: 0.75,
                sm: 1.5,
              },
            }}
          >
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setOpen(true)}
                sx={{ mr: 0.25 }}
                aria-label="Abrir navegación"
              >
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={750}
                noWrap
                sx={{
                  display: { xs: "none", sm: "block" },
                  lineHeight: 1.2,
                }}
              >
                {currentItem?.description ?? "Panel de ventas"}
              </Typography>
              <Typography
                variant="h6"
                fontWeight={850}
                noWrap
                sx={{
                  fontSize: { xs: "1.05rem", sm: "1.25rem" },
                  lineHeight: 1.2,
                }}
              >
                {currentItem?.label ?? "Punta Venta"}
              </Typography>
            </Box>

            {!isMobile && (
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{ mr: 2, maxWidth: 220 }}
              >
                {displayName}
              </Typography>
            )}

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={logout}
              aria-label="Cerrar sesión"
              sx={{
                minHeight: { xs: 38, sm: 40 },
                px: {
                  xs: 1.15,
                  sm: 2,
                },
                flexShrink: 0,
              }}
            >
              {isMobile ? "Salir" : "Cerrar sesión"}
            </Button>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: "100%",
            p: {
              xs: 1.5,
              sm: 2.5,
              lg: 3,
            },
            pb: {
              xs: `calc(${mobileNavigationHeight}px + env(safe-area-inset-bottom) + 24px)`,
              md: 3,
            },
            overflowX: "hidden",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 1480,
              mx: "auto",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      <MobileBottomNavigation
        currentPathname={location.pathname}
        items={mobileNavigationItems}
      />
    </Box>
  );
}
