import type { ComponentType } from "react";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { SvgIconProps } from "@mui/material/SvgIcon";

import BakeryDiningIcon from "@mui/icons-material/BakeryDining";
import CategoryIcon from "@mui/icons-material/Category";
import CookieIcon from "@mui/icons-material/Cookie";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import LocalDrinkIcon from "@mui/icons-material/LocalDrink";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

type CategoryIconComponent = ComponentType<SvgIconProps>;

type CategoryTone =
  | "default"
  | "hotDrink"
  | "coldDrink"
  | "sweets"
  | "bakery"
  | "snacks"
  | "other";

type CategoryPaletteColor = "primary" | "secondary" | "info" | "warning" | "error";

type CategoryVisual = {
  label: string;
  Icon: CategoryIconComponent;
  tone: CategoryTone;
};

const FALLBACK_CATEGORY_LABEL = "Sin categoría";

function normalizeCategoryName(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getCategoryDisplayName(label?: string | null) {
  const normalized = label?.trim();
  return normalized ? normalized : FALLBACK_CATEGORY_LABEL;
}

export function getCategoryVisual(label?: string | null): CategoryVisual {
  const displayLabel = getCategoryDisplayName(label);
  const normalized = normalizeCategoryName(displayLabel);

  if (/^sin categoria$|^sin clasificacion$|^sin asignar$/.test(normalized)) {
    return {
      label: displayLabel,
      Icon: CategoryIcon,
      tone: "default",
    };
  }

  if (/bebida.*caliente|caliente|cafe|coffee|te caliente|infusion/.test(normalized)) {
    return {
      label: displayLabel,
      Icon: LocalCafeIcon,
      tone: "hotDrink",
    };
  }

  if (/bebida.*fria|fria|frio|refresco|soda|cola|agua|jugo|bebida/.test(normalized)) {
    return {
      label: displayLabel,
      Icon: LocalDrinkIcon,
      tone: "coldDrink",
    };
  }

  if (/dulce|caramelo|chocolate|galleta|confiteria|postre/.test(normalized)) {
    return {
      label: displayLabel,
      Icon: CookieIcon,
      tone: "sweets",
    };
  }

  if (/pan|panader|reposter|tortilla|pastel|bizcocho/.test(normalized)) {
    return {
      label: displayLabel,
      Icon: BakeryDiningIcon,
      tone: "bakery",
    };
  }

  if (/snack|botana|fritura|papas|chips|antojito/.test(normalized)) {
    return {
      label: displayLabel,
      Icon: FastfoodIcon,
      tone: "snacks",
    };
  }

  if (/otro|vario|miscel|general|diverso/.test(normalized)) {
    return {
      label: displayLabel,
      Icon: LocalOfferIcon,
      tone: "other",
    };
  }

  return {
    label: displayLabel,
    Icon: Inventory2Icon,
    tone: "default",
  };
}

function getToneColor(tone: CategoryTone): CategoryPaletteColor {
  switch (tone) {
    case "hotDrink":
      return "warning";
    case "coldDrink":
      return "info";
    case "sweets":
      return "secondary";
    case "bakery":
      return "warning";
    case "snacks":
      return "error";
    case "other":
      return "primary";
    case "default":
    default:
      return "primary";
  }
}

export function CategoryOptionContent({ label }: { label: string }) {
  const visual = getCategoryVisual(label);
  const { Icon } = visual;
  const color = getToneColor(visual.tone);

  return (
    <Stack direction="row" spacing={1.15} alignItems="center" sx={{ minWidth: 0, py: 0.25 }}>
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
          width: 34,
          height: 34,
          borderRadius: 2,
          color: theme.palette[color].main,
          bgcolor: alpha(theme.palette[color].main, theme.palette.mode === "dark" ? 0.18 : 0.1),
          border: `1px solid ${alpha(theme.palette[color].main, 0.18)}`,
        })}
      >
        <Icon fontSize="small" />
      </Box>
      <Typography variant="body2" fontWeight={850} sx={{ overflowWrap: "anywhere" }}>
        {visual.label}
      </Typography>
    </Stack>
  );
}

export function CategoryInlineLabel({ label }: { label?: string | null }) {
  const visual = getCategoryVisual(label);
  const { Icon } = visual;
  const color = getToneColor(visual.tone);

  return (
    <Stack direction="row" spacing={0.85} alignItems="center" sx={{ minWidth: 0 }}>
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
          width: 28,
          height: 28,
          borderRadius: "50%",
          color: theme.palette[color].main,
          bgcolor: alpha(theme.palette[color].main, theme.palette.mode === "dark" ? 0.2 : 0.1),
          border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        })}
      >
        <Icon sx={{ fontSize: 17 }} />
      </Box>
      <Typography variant="body2" color="text.secondary" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
        {visual.label}
      </Typography>
    </Stack>
  );
}

export function CategoryPill({ label }: { label?: string | null }) {
  const visual = getCategoryVisual(label);
  const { Icon } = visual;
  const color = getToneColor(visual.tone);

  return (
    <Chip
      size="small"
      color={color}
      variant="outlined"
      icon={<Icon sx={{ fontSize: "1rem" }} />}
      label={visual.label}
      sx={{
        fontWeight: 800,
        "& .MuiChip-icon": {
          color: "inherit",
        },
      }}
    />
  );
}
