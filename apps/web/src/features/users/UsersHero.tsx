import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { PageHeader } from "../../components/PageHeader";
import type { UserSummary } from "./userShared";

type UsersHeroProps = {
  totalUsers: number;
  userSummary: UserSummary;
};

export function UsersHero({ totalUsers, userSummary }: UsersHeroProps) {
  const inactiveAccessRatio = totalUsers
    ? Math.round((userSummary.inactiveUsers / totalUsers) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title="Usuarios y vendedores"
        subtitle="Administra accesos internos. Crea vendedores, asigna permisos por rol y bloquea usuarios cuando sea necesario."
      />

      <Card
        sx={(theme) => ({
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.72)} 0%, ${alpha(
                  theme.palette.background.paper,
                  0.98,
                )} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 56%, ${theme.palette.info.dark} 100%)`,
          color: "primary.contrastText",
          mb: 2,
          overflow: "hidden",
          position: "relative",
          "&::after": {
            background:
              "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 62%)",
            content: '""',
            height: 240,
            position: "absolute",
            right: -90,
            top: -100,
            width: 240,
          },
        })}
      >
        <CardContent sx={{ position: "relative", zIndex: 1 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={1} sx={{ maxWidth: 700 }}>
              <Typography
                variant="overline"
                sx={{ color: "rgba(255,255,255,0.72)", letterSpacing: 1 }}
              >
                Control de accesos interno
              </Typography>
              <Typography variant="h5" fontWeight={900}>
                Directorio claro para decidir quién puede vender y quién puede administrar
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>
                Revisa personas activas, vendedores, administradores y accesos bloqueados
                desde una pantalla más cómoda para celular, tablet y computadora.
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(4, minmax(0, auto))",
                  md: "repeat(2, minmax(120px, 1fr))",
                },
                width: { xs: "100%", md: 300 },
              }}
              data-testid="users-hero-chips"
            >
              <Chip
                label={`${userSummary.activeUsers} activos`}
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "inherit" }}
              />
              <Chip
                label={`${userSummary.sellerUsers} vendedores`}
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "inherit" }}
              />
              <Chip
                label={`${userSummary.adminUsers} admins`}
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "inherit" }}
              />
              <Chip
                label={`${inactiveAccessRatio}% bloqueados`}
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "inherit" }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
