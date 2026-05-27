import type { ReactNode } from "react";

import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";

export type PageHeroTone = "primary" | "info" | "success" | "warning" | "error" | "neutral";

export type PageHeroStat = {
  label: string;
  value: ReactNode;
};

export type PageHeroProps = {
  children?: ReactNode;
  eyebrow?: ReactNode;
  stats?: PageHeroStat[];
  subtitle: ReactNode;
  sx?: SxProps<Theme>;
  title: ReactNode;
  tone?: PageHeroTone;
};

function getHeroColor(theme: Theme, tone: PageHeroTone) {
  if (tone === "neutral") {
    return theme.palette.grey[500];
  }

  return theme.palette[tone].main;
}

export function PageHero({
  children,
  eyebrow,
  stats = [],
  subtitle,
  sx,
  title,
  tone = "info",
}: PageHeroProps) {
  return (
    <Card
      sx={[
        (theme) => {
          const heroColor = getHeroColor(theme, tone);

          return {
            mb: 2.5,
            borderRadius: 5,
            border: "1px solid",
            borderColor: alpha(heroColor, 0.22),
            background: `linear-gradient(135deg, ${alpha(heroColor, 0.13)} 0%, ${alpha(
              theme.palette.success.main,
              0.08,
            )} 46%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
          };
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} md={stats.length ? 7 : 12}>
            <Stack spacing={1.5}>
              {eyebrow && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {eyebrow}
                </Stack>
              )}

              <Box>
                <Typography variant="h5" fontWeight={950} gutterBottom>
                  {title}
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
                  {subtitle}
                </Typography>
              </Box>

              {children}
            </Stack>
          </Grid>

          {stats.length > 0 && (
            <Grid item xs={12} md={5}>
              <Grid container spacing={1.5}>
                {stats.map((stat) => (
                  <Grid item xs={12} sm={6} key={stat.label}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: "rgba(255, 255, 255, 0.78)",
                        border: "1px solid rgba(148, 163, 184, 0.28)",
                        height: "100%",
                      }}
                    >
                      <Typography color="text.secondary" variant="caption">
                        {stat.label}
                      </Typography>
                      <Typography fontWeight={950}>{stat.value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}
