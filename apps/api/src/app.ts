import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import { env } from "./config/env";

import { errorHandler } from "./middlewares/errorHandler";
import { apiRateLimiter } from "./middlewares/rateLimit";
import { requestContext, requestLogger } from "./middlewares/requestContext";

import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { productsRouter } from "./modules/products/products.routes";
import { inventoryRouter } from "./modules/inventory/inventory.routes";
import { salesRouter } from "./modules/sales/sales.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { auditRouter } from "./modules/audit/audit.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { sellerActivityRouter } from "./modules/seller-activity/seller-activity.routes";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);

app.use(requestContext);
app.use(requestLogger);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "font-src": ["'self'", "https:", "data:"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'none'"],
        "img-src": ["'self'", "data:"],
        "object-src": ["'none'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "https:", "'unsafe-inline'"],
        "upgrade-insecure-requests":
          env.NODE_ENV === "production" ? [] : null
      }
    },

    crossOriginEmbedderPolicy: false,

    crossOriginResourcePolicy: {
      policy: "cross-origin"
    },

    referrerPolicy: {
      policy: "no-referrer"
    }
  })
);

app.use(compression());

app.use(cookieParser());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(apiRateLimiter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    requestId: req.requestId
  });
});

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/sales", salesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/audit", auditRouter);
app.use("/api/seller-activity", sellerActivityRouter);
app.use(errorHandler);