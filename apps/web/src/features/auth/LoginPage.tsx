import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
  alpha,
} from "@mui/material";

import { useAuth } from "../../auth/AuthContext";
import { useColorMode } from "../../theme/colorMode";
import { getApiErrorMessage } from "../../utils/apiError";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { mode, toggleMode } = useColorMode();

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
      sx={(theme) => ({
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.05fr) minmax(420px, 0.95fr)" },
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at 12% 8%, rgba(59,130,246,0.22), transparent 34%), linear-gradient(135deg,#020617,#0f172a 48%,#111827)"
            : "radial-gradient(circle at 12% 8%, rgba(37,99,235,0.14), transparent 34%), linear-gradient(135deg,#eef6ff,#f8fafc 46%,#e0f2fe)",
        color: "text.primary",
      })}
    >
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          alignItems: "center",
          justifyContent: "center",
          p: { lg: 6, xl: 9 },
        }}
      >
        <Stack spacing={4} sx={{ maxWidth: 640 }}>
          <Stack spacing={1.5}>
            <Chip
              label="Ventas, inventario y vendedores en un solo lugar"
              color="primary"
              sx={{ alignSelf: "flex-start", fontWeight: 800 }}
            />
            <Typography component="h1" variant="h2" fontWeight={950} letterSpacing={-1.4}>
              Punta Venta
            </Typography>
            <Typography color="text.secondary" fontSize={20} lineHeight={1.65}>
              Entra para vender, revisar existencias y supervisar la operación diaria sin depender de una caja abierta.
            </Typography>
          </Stack>

          <Box
            sx={(theme) => ({
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 1.5,
              "& > div": {
                minHeight: 122,
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                p: 2,
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.58 : 0.82),
                backdropFilter: "blur(18px)",
              },
            })}
          >
            <Box>
              <Typography fontWeight={900}>Vendedores</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                Accesos y permisos claros para operar sin ver módulos administrativos.
              </Typography>
            </Box>
            <Box>
              <Typography fontWeight={900}>Inventario</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                Existencias, entradas, salidas y movimientos conectados a ventas.
              </Typography>
            </Box>
            <Box>
              <Typography fontWeight={900}>Reportes</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                Ventas, utilidad y actividad disponibles para el administrador.
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          minHeight: { xs: "100vh", lg: "auto" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 3, md: 5, lg: 6 },
        }}
      >
        <Card
          sx={(theme) => ({
            width: "100%",
            maxWidth: { xs: 440, sm: 500 },
            borderRadius: { xs: 4, sm: 5 },
            border: "1px solid",
            borderColor: "divider",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 24px 80px rgba(0,0,0,0.34)"
                : "0 24px 80px rgba(15,23,42,0.14)",
            bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.88 : 0.96),
            backdropFilter: "blur(18px)",
          })}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
              <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                <Typography component="h1" variant="h4" fontWeight={950}>
                  Punta Venta
                </Typography>
                <Typography color="text.secondary">
                  Accede con la cuenta asignada por el administrador.
                </Typography>
              </Stack>
              <Button
                size="small"
                variant="outlined"
                onClick={toggleMode}
                sx={{ flexShrink: 0, borderRadius: 999 }}
              >
                {mode === "dark" ? "Modo día" : "Modo noche"}
              </Button>
            </Stack>

            <Box
              sx={(theme) => ({
                display: { xs: "grid", lg: "none" },
                gap: 1,
                mb: 3,
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.1 : 0.08),
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.18),
              })}
            >
              <Typography fontWeight={900}>Operación diaria</Typography>
              <Typography color="text.secondary" variant="body2">
                Registra ventas, consulta productos y revisa inventario desde cualquier dispositivo.
              </Typography>
            </Box>

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
                sx={{ py: 1.35 }}
              >
                {submitting ? "Validando acceso..." : "Iniciar sesión"}
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>
              Por seguridad, las sesiones se validan desde el servidor y pueden revocarse al cerrar sesión.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
