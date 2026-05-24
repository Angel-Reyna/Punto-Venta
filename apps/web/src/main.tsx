import React from "react";
import ReactDOM from "react-dom/client";

import { CssBaseline, ThemeProvider } from "@mui/material";

import App from "./App";
import { useReplaceInputTextOnFocus } from "./hooks/useReplaceInputTextOnFocus";

import { theme } from "./theme/theme";
import { AuthProvider } from "./auth/AuthContext";

function Root() {
  useReplaceInputTextOnFocus();

  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
