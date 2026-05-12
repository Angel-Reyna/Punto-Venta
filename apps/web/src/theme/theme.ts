import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#2563eb"
    },

    background: {
      default: "#f8fafc"
    }
  },

  shape: {
    borderRadius: 16
  },

  typography: {
    fontFamily:
      "Inter, Roboto, sans-serif",

    h4: {
      fontWeight: 800
    },

    h5: {
      fontWeight: 700
    },

    button: {
      textTransform: "none",
      fontWeight: 600
    }
  },

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.08)"
        }
      }
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 44
        }
      }
    },

    MuiTextField: {
      defaultProps: {
        size: "small"
      }
    }
  }
});