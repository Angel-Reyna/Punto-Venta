import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import FindInPageIcon from "@mui/icons-material/FindInPage";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import SecurityIcon from "@mui/icons-material/Security";
import TabletMacIcon from "@mui/icons-material/TabletMac";

import type { AuditLayoutVariant } from "./auditShared";

export function AuditHero({
  criticalEvents,
  latestEvent,
  mode = "desktop",
  visibleCount,
}: {
  criticalEvents: number;
  latestEvent: string;
  mode?: AuditLayoutVariant;
  visibleCount: number;
}) {
  if (mode === "mobile") {
    return (
      <Card
        sx={{
          border: 0,
          borderRadius: 3,
          color: "primary.contrastText",
          background:
            criticalEvents > 0
              ? "linear-gradient(145deg, #7f1d1d, #9a3412)"
              : "linear-gradient(145deg, #0f172a, #075985)",
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Chip
                icon={<PhoneAndroidIcon />}
                label="Vista celular"
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "inherit" }}
              />
              <Chip
                label={criticalEvents > 0 ? `${criticalEvents} revisar` : "Sin alertas"}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "inherit" }}
              />
            </Stack>

            <Box>
              <Typography variant="h5" fontWeight={950}>
                Bitácora rápida
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                Pensada para revisar en movimiento: primero verás la acción, el responsable y si requiere atención.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Box sx={{ flex: 1, borderRadius: 2, bgcolor: "rgba(255,255,255,0.12)", p: 1 }}>
                <Typography variant="h6" fontWeight={950}>
                  {visibleCount}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.78)" }}>
                  eventos
                </Typography>
              </Box>
              <Box sx={{ flex: 1.4, borderRadius: 2, bgcolor: "rgba(255,255,255,0.12)", p: 1 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.78)" }}>
                  Último cambio
                </Typography>
                <Typography variant="body2" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                  {latestEvent}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (mode === "tablet") {
    return (
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          background: "linear-gradient(160deg, rgba(25, 118, 210, 0.13), rgba(2, 136, 209, 0.06))",
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Stack spacing={1.25}>
            <Chip color="primary" icon={<TabletMacIcon />} label="Modo tablet" sx={{ alignSelf: "flex-start" }} />
            <Typography variant="h6" fontWeight={950}>
              Mesa de revisión
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Filtros fijos a la izquierda y tarjetas a la derecha para tocar, comparar y revisar sin una tabla angosta.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip color={criticalEvents > 0 ? "error" : "success"} label={`${criticalEvents} críticas`} />
              <Chip variant="outlined" label={`${visibleCount} visibles`} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        overflow: "hidden",
        borderRadius: 3,
        background:
          "linear-gradient(135deg, rgba(15, 23, 42, 0.06), rgba(25, 118, 210, 0.08) 48%, rgba(237, 108, 2, 0.06))",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 52,
                height: 52,
                borderRadius: 3,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <FindInPageIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip color="primary" label="Solo administradores" icon={<SecurityIcon />} size="small" />
                <Chip
                  color={criticalEvents > 0 ? "error" : "success"}
                  label={criticalEvents > 0 ? `${criticalEvents} críticas` : "Sin críticas visibles"}
                  size="small"
                  variant="outlined"
                />
              </Stack>
              <Typography variant="h5" fontWeight={950} sx={{ mt: 1 }}>
                Línea de tiempo de cambios
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vista de escritorio para investigar con filtros, evidencia antes/después y una guía lateral.
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              minWidth: 210,
              border: 1,
              borderColor: "divider",
              borderRadius: 2.5,
              bgcolor: "background.paper",
              p: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Último cambio registrado
            </Typography>
            <Typography fontWeight={900}>{latestEvent}</Typography>
            <Typography variant="caption" color="text.secondary">
              {visibleCount} evento(s) visibles
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
