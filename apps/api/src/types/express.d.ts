import type { AuthUser } from "../middlewares/auth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
      startedAt?: bigint;
    }
  }
}

export {};