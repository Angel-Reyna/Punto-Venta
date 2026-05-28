import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";

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
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 54%, ${theme.palette.info.dark} 100%)`,
          color: "primary.contrastText",
          mb: 2,
          overflow: "hidden",
          position: "relative",
          "&::after": {
            background:
              "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 62%)",
            content: '""',
            height: 220,
            position: "absolute",
            right: -80,
            top: -90,
            width: 220,
          },
        })}
      >
        <CardContent sx={{ position: "relative", zIndex: 1 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.75} sx={{ maxWidth: 680 }}>
              <Typography
                variant="overline"
                sx={{ color: "rgba(255,255,255,0.72)", letterSpacing: 1 }}
              >
                Control de accesos interno
              </Typography>
              <Typography variant="h5" fontWeight={900}>
                Gestiona vendedores y administradores sin exponer registro público
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>
                Revisa quién puede vender, quién administra la operación y qué
                accesos deben bloquearse antes de que representen riesgo operativo.
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              data-testid="users-hero-chips"
              sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}
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
                label={`${inactiveAccessRatio}% bloqueados`}
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "inherit" }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
