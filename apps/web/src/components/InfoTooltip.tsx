import { ReactNode } from "react";

import {
  Box,
  Tooltip,
  type SxProps,
  type Theme,
  type TooltipProps
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

type InfoTooltipProps = {
  title: ReactNode;
  ariaLabel?: string;
  placement?: TooltipProps["placement"];
  sx?: SxProps<Theme>;
};

export function InfoTooltip({
  title,
  ariaLabel,
  placement = "top",
  sx
}: InfoTooltipProps) {
  const accessibleLabel =
    ariaLabel ?? (typeof title === "string" ? title : "Más información");

  return (
    <Tooltip title={title} arrow placement={placement}>
      <Box
        component="span"
        tabIndex={0}
        aria-label={accessibleLabel}
        sx={[
          {
            alignItems: "center",
            color: "text.secondary",
            cursor: "help",
            display: "inline-flex",
            lineHeight: 0,
            outline: 0,
            verticalAlign: "middle",
            "&:focus-visible": {
              borderRadius: "50%",
              outline: (theme) => `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2
            }
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : [])
        ]}
      >
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </Box>
    </Tooltip>
  );
}

type LabelWithInfoProps = {
  label: ReactNode;
  info: ReactNode;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
};

export function LabelWithInfo({ label, info, ariaLabel, sx }: LabelWithInfoProps) {
  return (
    <Box
      component="span"
      sx={[
        {
          alignItems: "center",
          display: "inline-flex",
          gap: 0.5,
          minWidth: 0,
          whiteSpace: "nowrap"
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : [])
      ]}
    >
      <Box component="span">{label}</Box>
      <InfoTooltip title={info} ariaLabel={ariaLabel} />
    </Box>
  );
}
