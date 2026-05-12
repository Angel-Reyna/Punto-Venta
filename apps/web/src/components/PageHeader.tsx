import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",

        flexDirection: {
          xs: "column",
          sm: "row"
        },

        alignItems: {
          xs: "stretch",
          sm: "center"
        },

        justifyContent: "space-between",

        gap: 2,

        mb: 3
      }}
    >
      <Box>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            fontSize: {
              xs: "1.6rem",
              sm: "2rem"
            }
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            color="text.secondary"
            sx={{
              mt: 0.5
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {action && (
        <Box
          sx={{
            width: {
              xs: "100%",
              sm: "auto"
            }
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  );
}