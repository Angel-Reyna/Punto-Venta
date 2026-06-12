import { Box, Card, CardContent, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AutoAwesomeMosaicIcon from "@mui/icons-material/AutoAwesomeMosaic";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import type { AuditLayoutVariant, AuditView } from "./auditShared";

function LatestChangeBlock({ latestEvent }: { latestEvent: string }) {
  return (
    <Box
      sx={(theme) => ({
        border: 1,
        borderColor: alpha(theme.palette.warning.main, 0.22),
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette.warning.main, 0.055),
        minWidth: 0,
        p: 1.35,
      })}
    >
      <Stack direction="row" spacing={1.1} alignItems="center">
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 38,
            height: 38,
            borderRadius: 2,
            color: "warning.main",
            bgcolor: "background.paper",
            border: 1,
            borderColor: "warning.light",
            flexShrink: 0,
          }}
        >
          <AccessTimeIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={900}>
            Último cambio
          </Typography>
          <Typography fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
            {latestEvent}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function AuditHero({
  activeView,
  criticalEvents,
  latestEvent,
  mode = "desktop",
  onViewChange,
}: {
  activeView: AuditView;
  criticalEvents: number;
  latestEvent: string;
  mode?: AuditLayoutVariant;
  onViewChange: (value: AuditView) => void;
}) {
  const isMobile = mode === "mobile";
  const hasCritical = criticalEvents > 0;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: isMobile ? 3 : 3.5,
        overflow: "hidden",
        background: "linear-gradient(135deg, rgba(25, 118, 210, 0.08), rgba(2, 136, 209, 0.04))",
      }}
    >
      <CardContent sx={{ p: isMobile ? 1.5 : 2, "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
        <Stack spacing={1.75}>
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={1.25}
            alignItems={isMobile ? "stretch" : "center"}
            justifyContent="space-between"
          >
            <LatestChangeBlock latestEvent={latestEvent} />

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              justifyContent={isMobile ? "flex-start" : "flex-end"}
            >
              <Chip color="primary" icon={<SecurityIcon />} label="Acceso admin" size="small" />
              <Chip
                color={hasCritical ? "error" : "success"}
                icon={hasCritical ? <WarningAmberIcon /> : <SecurityIcon />}
                label={hasCritical ? `${criticalEvents} por revisar` : "Sin críticas"}
                size="small"
                variant={hasCritical ? "filled" : "outlined"}
              />
            </Stack>
          </Stack>

          <Tabs
            value={activeView}
            onChange={(_event, value: AuditView) => onViewChange(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            aria-label="Secciones de auditoría"
            sx={(theme) => ({
              minHeight: 44,
              "& .MuiTabs-scroller": {
                mx: { xs: -0.5, sm: 0 },
              },
              "& .MuiTabs-flexContainer": {
                gap: 1,
              },
              "& .MuiTab-root": {
                border: 1,
                borderColor: "divider",
                borderRadius: 999,
                minHeight: 40,
                px: { xs: 1.75, sm: 2.25 },
                textTransform: "none",
                whiteSpace: "nowrap",
              },
              "& .Mui-selected": {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            })}
          >
            <Tab value="activity" icon={<AutoAwesomeMosaicIcon fontSize="small" />} iconPosition="start" label="Mapa de actividad" />
            <Tab value="events" icon={<EventAvailableIcon fontSize="small" />} iconPosition="start" label="Eventos recientes" />
          </Tabs>
        </Stack>
      </CardContent>
    </Card>
  );
}
