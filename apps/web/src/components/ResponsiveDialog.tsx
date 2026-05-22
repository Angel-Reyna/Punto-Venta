import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import type { ReactNode } from "react";

type ResponsiveDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
  description?: ReactNode;
  disableClose?: boolean;
  maxWidth?: DialogProps["maxWidth"];
};

export function ResponsiveDialog({
  open,
  title,
  children,
  onClose,
  actions,
  description,
  disableClose = false,
  maxWidth = "sm",
}: ResponsiveDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClose: DialogProps["onClose"] = () => {
    if (!disableClose) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      disableEscapeKeyDown={disableClose}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          maxHeight: fullScreen ? "100dvh" : "calc(100% - 64px)",
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          pb: 1.5,
          pr: 7,
          position: "relative",
        }}
      >
        <Stack spacing={0.5}>
          <Typography component="h2" variant="h6" fontWeight={700}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Stack>

        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          disabled={disableClose}
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          flex: 1,
          overflowY: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
        }}
      >
        {children}
      </DialogContent>

      {actions ? (
        <DialogActions
          sx={{
            borderTop: 1,
            borderColor: "divider",
            px: { xs: 2, sm: 3 },
            py: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column-reverse", sm: "row" },
              gap: 1,
              justifyContent: "flex-end",
              width: "100%",
              "& > *": { width: { xs: "100%", sm: "auto" } },
            }}
          >
            {actions}
          </Box>
        </DialogActions>
      ) : null}
    </Dialog>
  );
}
