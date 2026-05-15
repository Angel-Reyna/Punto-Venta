import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#2563eb",
      dark: "#1d4ed8"
    },

    success: {
      main: "#16a34a",
      dark: "#15803d"
    },

    background: {
      default: "#f8fafc",
      paper: "#ffffff"
    },

    text: {
      primary: "#0f172a",
      secondary: "#64748b"
    }
  },

  shape: {
    borderRadius: 14
  },

  typography: {
    fontFamily: "Inter, Roboto, sans-serif",

    h4: {
      fontWeight: 800,
      letterSpacing: "-0.03em"
    },

    h5: {
      fontWeight: 750,
      letterSpacing: "-0.02em"
    },

    button: {
      textTransform: "none",
      fontWeight: 700
    }
  },

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #e2e8f0",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)"
        }
      }
    },

    MuiButton: {
      defaultProps: {
        variant: "contained",
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 44
        }
      }
    },

    MuiTextField: {
      defaultProps: {
        size: "small",
        fullWidth: true,
        InputLabelProps: {
          shrink: true
        }
      }
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12
        }
      }
    }
  }
});
