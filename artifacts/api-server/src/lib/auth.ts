import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import "express-session";

// Extend express-session to include our custom user data
declare module "express-session" {
  interface SessionData {
    user: {
      userId: number;
      email: string;
      role: string;
      hotelId: number | null;
    };
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Middleware: Verify the session cookie exists and contains user data
export function authenticate(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}

// Middleware: Role-based access control checking the session state
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user || !roles.includes(req.session.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
}