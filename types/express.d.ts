import { User } from './user';

declare global {
  namespace Express {
    interface Request {
      user?: { _id: string, email: string, name: string };
      cookies?: any;
    }
  }
}