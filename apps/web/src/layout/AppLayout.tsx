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
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from "@mui/icons-material/People";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";

import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const drawerWidth = 250;

export function AppLayout({
  children
}: {
  children: ReactNode;
}) {
  const { user, logout } = useAuth();

  const theme = useTheme();

  const isMobile = useMediaQuery(
    theme.breakpoints.down("md")
  );

  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const items = [
    {
      label: "Dashboard",
      to: "/",
      icon: <DashboardIcon />,
      show: true
    },
    {
      label: "Productos",
      to: "/products",
      icon: <InventoryIcon />,
      show: true
    },
    {
      label: "Inventario",
      to: "/inventory",
      icon: <InventoryIcon />,
      show: isAdmin
    },
    {
      label: "Ventas",
      to: "/sales",
      icon: <PointOfSaleIcon />,
      show: true
    },
    {
      label: "Reportes",
      to: "/reports",
      icon: <AssessmentIcon />,
      show: isAdmin
    },
    {
      label: "Usuarios",
      to: "/users",
      icon: <PeopleIcon />,
      show: isAdmin
    },
    {
      label: "Auditoría",
      to: "/audit",
      icon: <HistoryIcon />,
      show: isAdmin
    }
  ];

  const drawerContent = (
    <List>
      {items
        .filter((item) => item.show)
        .map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={() => setOpen(false)}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.label}
            />
          </ListItemButton>
        ))}
    </List>
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
              onClick={() => setOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700
            }}
          >
            POS Senior
          </Typography>

          {!isMobile && (
            <Typography sx={{ mr: 2 }}>
              {user?.name} · {user?.role}
            </Typography>
          )}

          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={logout}
          >
            Salir
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
        onClose={() => setOpen(false)}
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          width: isMobile
            ? undefined
            : drawerWidth,

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            pt: 8,
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