import { Typography } from "@mui/material";

export function ActionDisabledReason({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Typography
      variant="caption"
      color="text.secondary"
      role="status"
      aria-live="polite"
      sx={{ display: "block", mt: 0.75 }}
    >
      {message}
    </Typography>
  );
}
