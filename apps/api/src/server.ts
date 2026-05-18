import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const server = app.listen(env.PORT, () => {
  logger.info("API server started", {
    port: env.PORT,
    environment: env.NODE_ENV
  });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    error: reason
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    error
  });

  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Closing HTTP server.");

  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Closing HTTP server.");

  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
});
