import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";

export type EntityStatusTone = "default" | "success" | "warning" | "error" | "info";

export function EntityStatusChip({
  label,
  tone = "default",
  variant = "outlined",
  ...props
}: Omit<ChipProps, "color"> & { tone?: EntityStatusTone }) {
  return <Chip color={tone} label={label} size="small" variant={variant} {...props} />;
}
