import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

// Previously the only thing that ever printed to the terminal after
// startup was a 500-level error (see HttpExceptionFilter) — every normal
// request, successful or a plain validation 400, was completely silent.
// That made it look like "the backend log isn't showing anything" even
// when everything was working: an admin would save a form and have no
// way to tell, just from watching this terminal, whether the request
// even arrived. This logs one line per request/response so that's visible.
const logger = new Logger('HTTP');

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const ms = Date.now() - start;
    const { statusCode } = res;
    const line = `${method} ${originalUrl} ${statusCode} +${ms}ms`;
    if (statusCode >= 500) logger.error(line);
    else if (statusCode >= 400) logger.warn(line);
    else logger.log(line);
  });

  next();
}
