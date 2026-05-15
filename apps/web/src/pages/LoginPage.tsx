import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../utils/apiError";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setError("");
  }, [email, password]);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Escribe tu correo y contraseña para iniciar sesión.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await login(cleanEmail, password);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top left, rgba(37,99,235,0.28), transparent 32%), linear-gradient(135deg,#0f172a,#1e293b)",
        p: 2
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 460, borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight={800}>
              Punta Venta
            </Typography>

            <Typography color="text.secondary">
              Inicia sesión para registrar ventas, consultar productos y administrar el punto de venta.
            </Typography>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2 }}>
            <TextField
              fullWidth
              autoFocus
              required
              label="Correo electrónico"
              placeholder="usuario@empresa.com"
              type="email"
              autoComplete="email"
              value={email}
              error={submitted && !email.trim()}
              helperText={submitted && !email.trim() ? "El correo es obligatorio." : " "}
              onChange={(event) => setEmail(event.target.value)}
            />

            <TextField
              fullWidth
              required
              label="Contraseña"
              placeholder="Escribe tu contraseña"
              type="password"
              autoComplete="current-password"
              value={password}
              error={submitted && !password}
              helperText={submitted && !password ? "La contraseña es obligatoria." : " "}
              onChange={(event) => setPassword(event.target.value)}
            />

            <Button
              fullWidth
              size="large"
              type="submit"
              disabled={submitting || !email.trim() || !password}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {submitting ? "Validando acceso..." : "Iniciar sesión"}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>
            Usa la cuenta asignada por el administrador. Por seguridad, las sesiones se cierran desde el servidor.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
