import { FormEvent, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  TextField,
  Typography
} from "@mui/material";

import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Mode = "login" | "register";

export function LoginPage() {
  const { login } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@pos.local");
  const [password, setPassword] = useState("Admin12345");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setSuccess("");

    try {
      if (mode === "login") {
        await login(email, password);
        window.location.href = "/";
        return;
      }

      await api.post("/auth/register-cashier", {
        name,
        email,
        password
      });

      setSuccess("Cuenta de vendedor creada correctamente. Ya puedes iniciar sesión.");
      setMode("login");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo completar la operación");
    }
  }

  function switchMode() {
    setError("");
    setSuccess("");

    if (mode === "login") {
      setMode("register");
      setName("");
      setEmail("");
      setPassword("");
      return;
    }

    setMode("login");
    setName("");
    setEmail("admin@pos.local");
    setPassword("Admin12345");
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg,#0f172a,#1e293b)",
        p: 2
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 440, borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h4" fontWeight={800} mb={1}>
            POS Senior
          </Typography>

          <Typography color="text.secondary" mb={3}>
            {mode === "login" ? "Acceso al sistema" : "Crear cuenta de vendedor"}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2 }}>
            {mode === "register" && (
              <TextField
                fullWidth
                label="Nombre"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            )}

            <TextField
              fullWidth
              label="Correo"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              helperText={
                mode === "register"
                  ? "Mínimo 8 caracteres, una mayúscula, una minúscula y un número."
                  : undefined
              }
              onChange={(event) => setPassword(event.target.value)}
            />

            <Button
              fullWidth
              size="large"
              type="submit"
              disabled={mode === "register" ? !name || !email || !password : !email || !password}
            >
              {mode === "login" ? "Entrar" : "Crear cuenta"}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Button fullWidth variant="outlined" onClick={switchMode}>
            {mode === "login" ? "Crear cuenta de vendedor" : "Ya tengo cuenta"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}