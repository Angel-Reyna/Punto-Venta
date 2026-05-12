import { AnyZodObject } from "zod"; import { Request, Response, NextFunction } from "express";
export function validate(schema:AnyZodObject){ return (req:Request,res:Response,next:NextFunction)=>{ schema.parse({body:req.body,params:req.params,query:req.query}); next(); }; }
