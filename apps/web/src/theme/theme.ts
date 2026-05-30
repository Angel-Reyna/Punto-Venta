import { alpha, createTheme } from "@mui/material/styles";

export type AppColorMode = "light" | "dark";

export const colorModeStorageKey = "punta-venta-color-mode";

export function getInitialColorMode(): AppColorMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedMode = window.localStorage.getItem(colorModeStorageKey);

  if (storedMode === "light" || storedMode === "dark") {
    return storedMode;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function createAppTheme(mode: AppColorMode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,

      primary: {
        main: isDark ? "#60a5fa" : "#2563eb",
        dark: isDark ? "#3b82f6" : "#1d4ed8",
        light: isDark ? "#93c5fd" : "#60a5fa"
      },

      success: {
        main: isDark ? "#34d399" : "#16a34a",
        dark: isDark ? "#10b981" : "#15803d"
      },

      warning: {
        main: isDark ? "#fbbf24" : "#f59e0b"
      },

      error: {
        main: isDark ? "#fb7185" : "#dc2626"
      },

      info: {
        main: isDark ? "#38bdf8" : "#0284c7"
      },

      background: {
        default: isDark ? "#070f1d" : "#f6f8fb",
        paper: isDark ? "#0f172a" : "#ffffff"
      },

      divider: isDark ? "rgba(148, 163, 184, 0.18)" : "#e2e8f0",

      text: {
        primary: isDark ? "#e5eefb" : "#0f172a",
        secondary: isDark ? "#94a3b8" : "#64748b"
      },

      action: {
        hover: isDark ? "rgba(148, 163, 184, 0.08)" : "rgba(15, 23, 42, 0.04)",
        selected: isDark ? "rgba(96, 165, 250, 0.18)" : "rgba(37, 99, 235, 0.10)",
        disabledBackground: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(15, 23, 42, 0.08)"
      }
    },

    shape: {
      borderRadius: 16
    },

    typography: {
      fontFamily: "Inter, Roboto, sans-serif",

      h4: {
        fontWeight: 850,
        letterSpacing: "-0.035em"
      },

      h5: {
        fontWeight: 800,
        letterSpacing: "-0.025em"
      },

      h6: {
        letterSpacing: "-0.015em"
      },

      button: {
        textTransform: "none",
        fontWeight: 750
      }
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            minWidth: 0,
            backgroundColor: isDark ? "#070f1d" : "#f6f8fb"
          },
          body: {
            minWidth: 0,
            overflowX: "hidden",
            backgroundColor: isDark ? "#070f1d" : "#f6f8fb"
          },
          "#root": {
            minHeight: "100vh"
          },
          "::selection": {
            backgroundColor: isDark
              ? "rgba(96, 165, 250, 0.34)"
              : "rgba(37, 99, 235, 0.22)"
          }
        }
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none"
          }
        }
      },

      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${isDark ? "rgba(148, 163, 184, 0.18)" : "#e2e8f0"}`,
            boxShadow: isDark
              ? "0 18px 46px rgba(0, 0, 0, 0.24)"
              : "0 14px 34px rgba(15, 23, 42, 0.06)",
            backgroundImage: isDark
              ? "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.92))"
              : "linear-gradient(180deg, #ffffff, #fbfdff)"
          }
        }
      },

      MuiCardContent: {
        styleOverrides: {
          root: ({ theme }) => ({
            padding: theme.spacing(2),
            "&:last-child": {
              paddingBottom: theme.spacing(2)
            },
            [theme.breakpoints.up("sm")]: {
              padding: theme.spacing(2.35),
              "&:last-child": {
                paddingBottom: theme.spacing(2.35)
              }
            }
          })
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
            minHeight: 44,
            "&.Mui-focusVisible": {
              outline: `3px solid ${alpha(isDark ? "#60a5fa" : "#2563eb", 0.35)}`,
              outlineOffset: 2
            }
          }
        }
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            "&.Mui-focusVisible": {
              outline: `3px solid ${alpha(isDark ? "#60a5fa" : "#2563eb", 0.35)}`,
              outlineOffset: 2
            }
          }
        }
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            "&.Mui-focusVisible": {
              outline: `3px solid ${alpha(isDark ? "#60a5fa" : "#2563eb", 0.35)}`,
              outlineOffset: -2
            }
          }
        }
      },

      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700
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
}

export const theme = createAppTheme("light");
