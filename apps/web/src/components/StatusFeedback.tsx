import { Alert, Stack } from "@mui/material";

export function StatusFeedback({
  success,
  error,
  onSuccessClose,
  onErrorClose
}: {
  success?: string;
  error?: string;
  onSuccessClose?: () => void;
  onErrorClose?: () => void;
}) {
  if (!success && !error) return null;

  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      {success && (
        <Alert
          severity="success"
          role="status"
          aria-live="polite"
          onClose={onSuccessClose}
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          role="alert"
          aria-live="assertive"
          onClose={onErrorClose}
        >
          {error}
        </Alert>
      )}
    </Stack>
  );
}
