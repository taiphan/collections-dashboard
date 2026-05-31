import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infrastructure/database/prisma.js';
import { config } from '../../shared/config/index.js';
import { UnauthorizedError, ValidationError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';

const log = createChildLogger({ module: 'auth' });
const BCRYPT_ROUNDS = 12;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum([
    'ADMIN', 'MANAGER', 'UNDERWRITER',
    'LOAN_OFFICER', 'COMPLIANCE_OFFICER', 'VIEWER',
  ]).default('LOAN_OFFICER'),
  department: z.string().max(100).optional(),
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid credentials');
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.JWT_SECRET,
        { expiresIn: config.JWT_ACCESS_EXPIRY } as any,
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        config.JWT_SECRET,
        { expiresIn: config.JWT_REFRESH_EXPIRY } as any,
      );

      log.info({ userId: user.id }, 'User logged in');

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerSchema.parse(req.body);

      const existing = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new ValidationError('Email already registered');
      }

      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

      const user = await prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role,
          department: input.department,
        },
      });

      log.info({ userId: user.id }, 'User registered');

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          lastLoginAt: true,
        },
      });

      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
