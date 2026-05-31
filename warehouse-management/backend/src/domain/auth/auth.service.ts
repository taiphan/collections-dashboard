import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infrastructure/database/prisma.js';
import { config } from '../../shared/config/index.js';
import { UnauthorizedError } from '../../shared/errors/index.js';
import { createChildLogger } from '../../shared/utils/logger.js';
import type { AuthPayload } from '../../app/middleware/auth.middleware.js';

const log = createChildLogger({ module: 'auth-service' });
const BCRYPT_ROUNDS = 12;

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRY as string,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRY as string } as jwt.SignOptions,
    );

    log.info({ userId: user.id }, 'User logged in');

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as {
        userId: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const payload: AuthPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_ACCESS_EXPIRY as string,
      } as jwt.SignOptions);

      return { accessToken };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }
}

export const authService = new AuthService();
