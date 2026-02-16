import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

const sanitizeValue = (value: any): any => {
  if (typeof value === 'string') {
    return xss(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
};

const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    sanitized[key] = sanitizeValue(obj[key]);
  }
  return sanitized;
};

const sanitize = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query) as any;
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params) as any;
  }
  next();
};

export default sanitize;
