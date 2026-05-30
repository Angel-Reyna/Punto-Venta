import { Box, Card, CardContent, Chip, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";

import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { EmptyStatePanel } from "../../components/data-display";
import { AuditLogCard, type AuditLayoutVariant, type AuditLog } from "./auditShared";

function useAuditLayoutVariant(): AuditLayoutVariant {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));

  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
}

function getResultsCopy(variant: AuditLayoutVariant, visibleCount: number) {
  if (variant === "mobile") {
    return {
      title: `${visibleCount} evento(s) visibles`,
      eyebrow: "Feed móvil",
      helper: "Una tarjeta por cambio. Lee lo esencial y abre detalles solo si hace falta.",
    };
  }

  if (variant === "tablet") {
    return {
      title: `${visibleCount} evento(s) visibles`,
      eyebrow: "Tablero táctil",
      helper: "Tarjetas amplias para comparar eventos sin forzar una tabla horizontal.",
    };
  }

  return {
    title: `${visibleCount} evento(s) visibles`,
    eyebrow: "Línea de tiempo",
    helper: "Vista de investigación con contexto, responsable, área afectada y evidencia del cambio.",
  };
}

export function AuditResultsSection({
  criticalEvents,
  layoutVariant,
  visibleRows,
}: {
  criticalEvents: number;
  layoutVariant?: AuditLayoutVariant;
  visibleRows: AuditLog[];
}) {
  const detectedLayoutVariant = useAuditLayoutVariant();
  const variant = layoutVariant ?? detectedLayoutVariant;
  const copy = getResultsCopy(variant, visibleRows.length);

  return (
    <Stack spacing={variant === "mobile" ? 1.25 : 1.75}>
      <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: variant === "mobile" ? "none" : undefined }}>
        <CardContent sx={{ p: variant === "mobile" ? 1.5 : 2 }}>
          <Stack
            direction={variant === "desktop" ? "row" : "column"}
            spacing={1.25}
            alignItems={variant === "desktop" ? "center" : "stretch"}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={900}>
                {copy.eyebrow}
              </Typography>
              <Typography
                variant={variant === "mobile" ? "subtitle1" : "h6"}
                fontWeight={950}
                data-testid="audit-results-heading"
              >
                {copy.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {copy.helper}
              </Typography>
            </Box>
            <Chip
              color={criticalEvents > 0 ? "error" : "success"}
              label={criticalEvents > 0 ? "Revisar acciones críticas" : "Sin críticas visibles"}
              icon={criticalEvents > 0 ? <WarningAmberIcon /> : <SecurityIcon />}
              sx={{ alignSelf: variant === "desktop" ? "center" : "flex-start" }}
            />
          </Stack>
        </CardContent>
      </Card>

      {visibleRows.length === 0 ? (
        <EmptyStatePanel>
          No hay registros con los filtros actuales. Limpia filtros o realiza una acción administrativa para ver actividad.
        </EmptyStatePanel>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: variant === "mobile" ? 1.25 : 1.5,
            gridTemplateColumns: variant === "tablet" ? "repeat(2, minmax(0, 1fr))" : "1fr",
          }}
        >
          {visibleRows.map((log, index) => (
            <AuditLogCard key={log.id} index={index + 1} log={log} variant={variant} />
          ))}
        </Box>
      )}
    </Stack>
  );
}
