import type { ReactNode } from "react";

import { Box, Card, CardContent, Chip, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

import AutoAwesomeMosaicIcon from "@mui/icons-material/AutoAwesomeMosaic";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SecurityIcon from "@mui/icons-material/Security";
import StorefrontIcon from "@mui/icons-material/Storefront";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import {
  formatAuditModuleLabel,
  formatRole,
  getAuditModule,
  getAuditSeverity,
  type AuditLayoutVariant,
  type AuditLog,
} from "./auditShared";

type Tone = "primary" | "success" | "warning" | "error" | "info";

type CountItem = {
  helper?: string;
  icon?: ReactNode;
  label: string;
  tone: Tone;
  value: number;
};

const SEVERITY_COPY: Record<ReturnType<typeof getAuditSeverity>["level"], { label: string; tone: Tone }> = {
  critical: { label: "Críticas", tone: "error" },
  high: { label: "Altas", tone: "warning" },
  medium: { label: "Medias", tone: "info" },
  low: { label: "Bajas", tone: "success" },
};

function percentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function countBy<T extends string>(rows: AuditLog[], getKey: (row: AuditLog) => T) {
  const counts = new Map<T, number>();

  for (const row of rows) {
    const key = getKey(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function getWorkArea(row: AuditLog): CountItem["label"] {
  return formatAuditModuleLabel(getAuditModule(row));
}

function getWorkAreaTone(label: string): Tone {
  if (label === "Ventas") return "success";
  if (label === "Inventario") return "warning";
  if (label === "Usuarios" || label === "Seguridad") return "error";
  if (label === "Sistema") return "info";
  return "primary";
}

function AuditMiniMetric({ helper, icon, label, tone, value }: CountItem) {
  const theme = useTheme();
  const colors = theme.palette[tone];

  return (
    <Box
      sx={{
        border: 1,
        borderColor: alpha(colors.main, 0.2),
        borderRadius: 2.5,
        bgcolor: alpha(colors.main, 0.065),
        minWidth: 0,
        p: { xs: 1, sm: 1.25 },
      }}
    >
      <Stack direction="row" spacing={0.85} alignItems="center" justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={900} noWrap>
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={950} sx={{ lineHeight: 1.05 }}>
            {value}
          </Typography>
        </Box>
        {icon && (
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 32,
              height: 32,
              borderRadius: 1.75,
              color: colors.main,
              bgcolor: alpha(colors.main, 0.08),
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
      </Stack>
      {helper && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          {helper}
        </Typography>
      )}
    </Box>
  );
}

function AuditBar({ item, max }: { item: CountItem; max: number }) {
  const theme = useTheme();
  const colors = theme.palette[item.tone];
  const width = max > 0 ? Math.max(7, Math.round((item.value / max) * 100)) : 0;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="baseline">
        <Typography variant="body2" fontWeight={900} noWrap title={item.label} sx={{ minWidth: 0 }}>
          {item.label}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={900} sx={{ flexShrink: 0 }}>
          {item.value}
        </Typography>
      </Stack>
      {item.helper && (
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
          {item.helper}
        </Typography>
      )}
      <Box sx={{ mt: 0.75, height: 8, borderRadius: 999, bgcolor: alpha(colors.main, 0.13), overflow: "hidden" }}>
        <Box
          sx={{
            width: `${width}%`,
            height: "100%",
            borderRadius: 999,
            bgcolor: colors.main,
            transition: "width 180ms ease-out",
          }}
        />
      </Box>
    </Box>
  );
}

function InsightGroup({
  icon,
  items,
  max,
  title,
}: {
  icon: ReactNode;
  items: CountItem[];
  max: number;
  title: string;
}) {
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 3, p: 1.5, minWidth: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
        {icon}
        <Typography variant="subtitle2" fontWeight={950} noWrap>
          {title}
        </Typography>
      </Stack>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Sin datos visibles.
        </Typography>
      ) : (
        <Stack spacing={1.1}>
          {items.map((item) => (
            <AuditBar key={item.label} item={item} max={max} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function EmptyInsight() {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        p: 2,
        bgcolor: "background.default",
      }}
    >
      <Typography fontWeight={950}>Sin eventos para mostrar</Typography>
      <Typography variant="body2" color="text.secondary">
        Ajusta filtros o consulta un periodo con actividad.
      </Typography>
    </Box>
  );
}

export function AuditInsightsPanel({
  mode = "desktop",
  uniqueUsers,
  visibleRows,
}: {
  mode?: AuditLayoutVariant;
  uniqueUsers: number;
  visibleRows: AuditLog[];
}) {
  const theme = useTheme();
  const isMobile = mode === "mobile";
  const visibleCount = visibleRows.length;
  const severityCounts = countBy(visibleRows, (row) => getAuditSeverity(row).level);
  const severityItems: CountItem[] = (["critical", "high", "medium", "low"] as const).map((level) => {
    const copy = SEVERITY_COPY[level];
    return {
      label: copy.label,
      tone: copy.tone,
      value: severityCounts.find((item) => item.label === level)?.value ?? 0,
    };
  });
  const criticalCount = severityItems.find((item) => item.label === "Críticas")?.value ?? 0;
  const criticalPercent = percentage(criticalCount, visibleCount);
  const areaItems: CountItem[] = countBy(visibleRows, getWorkArea)
    .slice(0, 5)
    .map((item) => ({ ...item, tone: getWorkAreaTone(item.label), helper: "eventos" }));
  const actorItems: CountItem[] = countBy(visibleRows, (row) => row.user?.name ?? "Sistema")
    .slice(0, 5)
    .map((item) => {
      const matchingLog = visibleRows.find((row) => (row.user?.name ?? "Sistema") === item.label);
      return {
        ...item,
        helper: matchingLog?.user ? formatRole(matchingLog.user.role) : "Automático",
        tone: matchingLog?.user?.role === "ADMIN" ? "primary" : "success",
      };
    });
  const maxArea = Math.max(...areaItems.map((item) => item.value), 0);
  const maxActor = Math.max(...actorItems.map((item) => item.value), 0);
  const statusTone: Tone = criticalCount > 0 ? "error" : visibleCount > 0 ? "success" : "info";
  const statusLabel = criticalCount > 0 ? "Revisar" : visibleCount > 0 ? "Estable" : "Sin actividad";

  return (
    <Card
      data-testid="audit-insights-panel"
      sx={{
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.16),
        borderRadius: 3.5,
        overflow: "hidden",
        boxShadow: isMobile ? "none" : `0 18px 44px ${alpha(theme.palette.common.black, 0.07)}`,
      }}
    >
      <Box
        sx={{
          px: isMobile ? 1.5 : 2.25,
          py: isMobile ? 1.4 : 1.8,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.13)}, ${alpha(theme.palette.info.main, 0.07)} 55%, ${alpha(theme.palette.warning.main, 0.08)})`,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={1.25}
          alignItems={isMobile ? "flex-start" : "center"}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 42,
                height: 42,
                borderRadius: 2.5,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                flexShrink: 0,
              }}
            >
              <AutoAwesomeMosaicIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={950}>
                Mapa de actividad
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cambios, responsables y módulos activos.
              </Typography>
            </Box>
          </Stack>
          <Chip color={statusTone} label={statusLabel} icon={criticalCount > 0 ? <WarningAmberIcon /> : <SecurityIcon />} />
        </Stack>
      </Box>

      <CardContent sx={{ p: isMobile ? 1.5 : 2.25 }}>
        {visibleCount === 0 ? (
          <EmptyInsight />
        ) : (
          <Stack spacing={1.5}>
            <Box
              sx={{
                display: "grid",
                gap: 1.25,
                gridTemplateColumns: { xs: "1fr", md: mode === "tablet" ? "1fr" : "minmax(220px, 0.85fr) minmax(0, 1.8fr)" },
                alignItems: "stretch",
              }}
            >
              <Box
                sx={{
                  border: 1,
                  borderColor: criticalCount > 0 ? alpha(theme.palette.error.main, 0.28) : alpha(theme.palette.success.main, 0.28),
                  borderRadius: 3,
                  p: 1.5,
                  bgcolor: criticalCount > 0 ? alpha(theme.palette.error.main, 0.06) : alpha(theme.palette.success.main, 0.06),
                  minWidth: 0,
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={900}>
                  Atención prioritaria
                </Typography>
                <Stack direction="row" spacing={1.25} alignItems="flex-end" sx={{ mt: 0.5 }}>
                  <Typography variant="h3" fontWeight={950} sx={{ lineHeight: 1 }}>
                    {criticalCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ pb: 0.35 }}>
                    críticas · {criticalPercent}%
                  </Typography>
                </Stack>
                <Box sx={{ mt: 1.25, height: 10, borderRadius: 999, bgcolor: alpha(theme.palette.text.primary, 0.1), overflow: "hidden" }}>
                  <Box
                    sx={{
                      width: `${Math.max(criticalPercent, criticalCount > 0 ? 7 : 0)}%`,
                      height: "100%",
                      borderRadius: 999,
                      bgcolor: criticalCount > 0 ? "error.main" : "success.main",
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {criticalCount > 0 ? "Prioriza eliminaciones, accesos y cancelaciones." : "Sin alertas críticas visibles."}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
                }}
              >
                <AuditMiniMetric label="Eventos" value={visibleCount} helper="visibles" tone="primary" icon={<EventAvailableIcon fontSize="small" />} />
                <AuditMiniMetric label="Personas" value={uniqueUsers} helper="activas" tone="success" icon={<PeopleAltIcon fontSize="small" />} />
                <AuditMiniMetric label="Módulos" value={areaItems.length} helper="con cambios" tone="warning" icon={<StorefrontIcon fontSize="small" />} />
                <AuditMiniMetric label="Altas" value={severityItems.find((item) => item.label === "Altas")?.value ?? 0} helper="importantes" tone="warning" icon={<WarningAmberIcon fontSize="small" />} />
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 1.25,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: mode === "tablet" ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(190px, 1fr))",
                },
              }}
            >
              <InsightGroup
                icon={<StorefrontIcon color="primary" fontSize="small" />}
                items={areaItems}
                max={maxArea}
                title="Módulos con más cambios"
              />
              <InsightGroup
                icon={<PeopleAltIcon color="success" fontSize="small" />}
                items={actorItems}
                max={maxActor}
                title="Responsables"
              />
              <InsightGroup
                icon={<WarningAmberIcon color="warning" fontSize="small" />}
                items={severityItems.map((item) => ({ ...item, helper: `${percentage(item.value, visibleCount)}%` }))}
                max={visibleCount}
                title="Nivel de atención"
              />
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
