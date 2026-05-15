import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

export function validate(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      if (Object.prototype.hasOwnProperty.call(parsed, "body")) {
        req.body = parsed.body;
      }

      if (Object.prototype.hasOwnProperty.call(parsed, "query")) {
        req.query = parsed.query;
      }

      if (Object.prototype.hasOwnProperty.call(parsed, "params")) {
        req.params = parsed.params;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
