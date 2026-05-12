import { FormEvent, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography
} from "@mui/material";

import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState(
    "admin@pos.local"
  );

  const [password, setPassword] = useState(
    "Admin12345"
  );

  const [error, setError] = useState("");

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");

    try {
      await login(email, password);

      location.href = "/";
    } catch {
      setError(
        "Credenciales inválidas"
      );
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",

        display: "grid",

        placeItems: "center",

        background:
          "linear-gradient(135deg,#0f172a,#1e293b)",

        p: 2
      }}
    >
      <Card
        sx={{
          width: "100%",

          maxWidth: 420,

          borderRadius: 4
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 3,
              sm: 4
            }
          }}
        >
          <Typography
            variant="h4"
            fontWeight={800}
            mb={1}
          >
            POS Senior
          </Typography>

          <Typography
            color="text.secondary"
            mb={3}
          >
            Acceso al sistema
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={submit}
            sx={{
              display: "grid",
              gap: 2
            }}
          >
            <TextField
              fullWidth
              label="Correo"

              value={email}

              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"

              value={password}

              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
            />

            <Button
              fullWidth
              size="large"
              type="submit"
            >
              Entrar
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}