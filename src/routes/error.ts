import { Request, Response, NextFunction } from "express";
import { error } from "../lib/logger";
const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let message = "";
  if (err instanceof Error) {
    message = err.message;
    error(message);
  }
  return res.status(500).json({ error: message });
};

export default errorHandler;
