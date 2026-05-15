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

      if ("body" in parsed) {
        req.body = parsed.body;
      }

      if ("query" in parsed) {
        req.query = parsed.query;
      }

      if ("params" in parsed) {
        req.params = parsed.params;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}