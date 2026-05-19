import { ReactNode, useState } from "react";

import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";

import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory2";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from "@mui/icons-material/People";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";

import { NavLink } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

const drawerWidth = 250;

export function AppLayout({
  children
}: {
  children: ReactNode;
}) {
  const {
    user,
    logout,
    isAdmin
  } = useAuth();

  const theme = useTheme();

  const isMobile = useMediaQuery(
    theme.breakpoints.down("md")
  );

  const [open, setOpen] =
    useState(false);

  const menuItems = [
    {
      label: "Inicio",
      to: "/",
      icon: <DashboardIcon />,
      visible: true
    },

    {
      label: "Productos",
      to: "/products",
      icon: <InventoryIcon />,
      visible: true
    },

    {
      label: "Nueva venta",
      to: "/sales",
      icon: <PointOfSaleIcon />,
      visible: true
    },

    {
      label: "Inventario",
      to: "/inventory",
      icon: <InventoryIcon />,
      visible: isAdmin
    },

    {
      label: "Caja",
      to: "/cash-register",
      icon: <PointOfSaleOutlinedIcon />,
      visible: true
    },

    {
      label: "Reportes",
      to: "/reports",
      icon: <AssessmentIcon />,
      visible: isAdmin
    },

    {
      label: "Usuarios",
      to: "/users",
      icon: <PeopleIcon />,
      visible: isAdmin
    },

    {
      label: "Actividad vendedores",
      to: "/seller-activity",
      icon: <ManageSearchIcon />,
      visible: isAdmin
    },

    {
      label: "Auditoría",
      to: "/audit",
      icon: <HistoryIcon />,
      visible: isAdmin
    }
  ];

  const drawerContent = (
    <Box>
      <Box
        sx={{
          px: 2,
          py: 3,
          borderBottom:
            "1px solid #e2e8f0"
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
        >
          Punta Venta
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1 }}
        >
          Sistema POS
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {user?.name}
        </Typography>

        <Typography
          variant="caption"
          color="primary"
          fontWeight={700}
        >
          {user?.role}
        </Typography>
      </Box>

      <List>
        {menuItems
          .filter(
            (item) => item.visible
          )
          .map((item) => (
            <ListItemButton
              key={item.to}

              component={NavLink}

              to={item.to}

              onClick={() =>
                setOpen(false)
              }

              sx={{
                "&.active": {
                  background:
                    "#dbeafe",

                  color:
                    "#1d4ed8",

                  "& .MuiListItemIcon-root":
                    {
                      color:
                        "#1d4ed8"
                    }
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={
                  item.label
                }
              />
            </ListItemButton>
          ))}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh"
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1300
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() =>
                setOpen(true)
              }
              sx={{
                mr: 1
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 800
            }}
          >
            Punta Venta
          </Typography>

          {!isMobile && (
            <Box
              sx={{
                textAlign: "right",
                mr: 2
              }}
            >
              <Typography
                variant="body2"
              >
                {user?.name}
              </Typography>

              <Typography
                variant="caption"
              >
                {user?.role}
              </Typography>
            </Box>
          )}

          <Button
            variant="text"
            color="inherit"
            startIcon={
              <LogoutIcon />
            }
            onClick={logout}
            aria-label="Cerrar sesión"
          >
            Cerrar sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={
          isMobile
            ? "temporary"
            : "permanent"
        }
        open={
          isMobile
            ? open
            : true
        }
        onClose={() =>
          setOpen(false)
        }
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          width: isMobile
            ? undefined
            : drawerWidth,

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            pt: isMobile
              ? 0
              : 8,

            borderRight:
              "1px solid #e2e8f0"
          }
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,

          width: {
            xs: "100%",
            md: `calc(100% - ${drawerWidth}px)`
          },

          p: {
            xs: 2,
            sm: 3
          },

          pt: {
            xs: 10,
            sm: 11
          },

          overflowX: "hidden"
        }}
      >
        {children}
      </Box>
    </Box>
  );
}