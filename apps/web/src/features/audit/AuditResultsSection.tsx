import { useEffect, useMemo, useState } from "react";

import {
  Box,
  FormControl,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

import { EmptyStatePanel } from "../../components/data-display";
import { AuditLogCard, type AuditLayoutVariant, type AuditLog } from "./auditShared";

const PAGE_SIZE_OPTIONS = [3, 10] as const;
type AuditEventsPageSize = (typeof PAGE_SIZE_OPTIONS)[number];

function useAuditLayoutVariant(): AuditLayoutVariant {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));

  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

function getPageSummary(total: number, page: number, pageSize: AuditEventsPageSize) {
  if (total === 0) return "Sin eventos";

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return `Mostrando ${from}-${to} de ${total}`;
}

export function AuditResultsSection({
  criticalEvents: _criticalEvents,
  layoutVariant,
  visibleRows,
}: {
  criticalEvents: number;
  layoutVariant?: AuditLayoutVariant;
  visibleRows: AuditLog[];
}) {
  const detectedLayoutVariant = useAuditLayoutVariant();
  const variant = layoutVariant ?? detectedLayoutVariant;
  const [rowsPerPage, setRowsPerPage] = useState<AuditEventsPageSize>(3);
  const [page, setPage] = useState(1);
  const rowSignature = useMemo(() => visibleRows.map((log) => log.id).join("|"), [visibleRows]);
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / rowsPerPage));
  const currentPage = clampPage(page, totalPages);
  const pageRows = visibleRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const summary = getPageSummary(visibleRows.length, currentPage, rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [rowSignature, rowsPerPage]);

  useEffect(() => {
    setPage((current) => clampPage(current, totalPages));
  }, [totalPages]);

  const handleRowsPerPageChange = (event: SelectChangeEvent<number>) => {
    const nextValue = Number(event.target.value);
    const safeValue = PAGE_SIZE_OPTIONS.includes(nextValue as AuditEventsPageSize)
      ? (nextValue as AuditEventsPageSize)
      : 3;
    setRowsPerPage(safeValue);
  };

  return (
    <Stack data-testid="audit-events-section" spacing={variant === "mobile" ? 1.1 : 1.35}>
      {visibleRows.length === 0 ? (
        <EmptyStatePanel>
          No hay cambios con los filtros actuales. Limpia filtros o consulta otro periodo.
        </EmptyStatePanel>
      ) : (
        <>
          <Stack
            direction={variant === "mobile" ? "column" : "row"}
            spacing={1}
            alignItems={variant === "mobile" ? "stretch" : "center"}
            justifyContent="space-between"
            sx={{ px: { xs: 0.25, sm: 0.5 } }}
          >
            <Typography
              data-testid="audit-events-pagination-summary"
              variant="body2"
              color="text.secondary"
              fontWeight={800}
            >
              {summary}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              <Typography variant="caption" color="text.secondary" fontWeight={800}>
                Por página
              </Typography>
              <FormControl size="small" sx={{ minWidth: 92 }}>
                <Select
                  aria-label="Eventos por página"
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  inputProps={{ "data-testid": "audit-events-page-size" }}
                  sx={{ borderRadius: 999, fontWeight: 900 }}
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: variant === "mobile" ? 1 : 1.15,
              gridTemplateColumns: "1fr",
            }}
          >
            {pageRows.map((log, index) => (
              <AuditLogCard key={log.id} index={(currentPage - 1) * rowsPerPage + index + 1} log={log} variant={variant} />
            ))}
          </Box>

          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center" sx={{ pt: 0.25 }}>
              <Pagination
                color="primary"
                count={totalPages}
                page={currentPage}
                onChange={(_event, nextPage) => setPage(nextPage)}
                shape="rounded"
                siblingCount={variant === "mobile" ? 0 : 1}
                boundaryCount={1}
              />
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
