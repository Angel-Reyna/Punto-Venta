import {
  NextFunction,
  Request,
  Response
} from "express";

import {
  AnyZodObject,
  ZodError
} from "zod";

export function validate(
  schema: AnyZodObject
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}