import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";

import { CssBaseline, ThemeProvider } from "@mui/material";

import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { useReplaceInputTextOnFocus } from "./hooks/useReplaceInputTextOnFocus";
import { ColorModeContext } from "./theme/colorMode";
import {
  colorModeStorageKey,
  createAppTheme,
  getInitialColorMode,
  type AppColorMode
} from "./theme/theme";

function Root() {
  useReplaceInputTextOnFocus();

  const [mode, setMode] = useState<AppColorMode>(() => getInitialColorMode());

  const appTheme = useMemo(() => createAppTheme(mode), [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () => {
        setMode((currentMode) => (currentMode === "dark" ? "light" : "dark"));
      }
    }),
    [mode]
  );

  useEffect(() => {
    window.localStorage.setItem(colorModeStorageKey, mode);
    document.documentElement.dataset.colorMode = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <React.StrictMode>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={appTheme}>
          <CssBaseline />

          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
