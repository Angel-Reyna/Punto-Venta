import rateLimit from "express-rate-limit";

type RateLimiterConfig = {
  windowMs: number;
  limit: number;
  message: string;
  skipSuccessfulRequests?: boolean;
};

function createJsonRateLimiter({
  windowMs,
  limit,
  message,
  skipSuccessfulRequests = false
}: RateLimiterConfig) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: {
      message
    }
  });
}

export const apiRateLimiter = createJsonRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: "Demasiadas solicitudes. Espera un momento e intenta de nuevo."
});

export const authLoginRateLimiter = createJsonRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Demasiados intentos de inicio de sesión. Espera unos minutos e intenta de nuevo."
});

export const authRefreshRateLimiter = createJsonRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: "Demasiadas renovaciones de sesión. Inicia sesión nuevamente."
});

export const authSensitiveActionRateLimiter = createJsonRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Demasiadas acciones de autenticación. Espera un momento e intenta de nuevo."
});
