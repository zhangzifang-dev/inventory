import { JwtService } from '@nestjs/jwt';

export const createMockJwtService = (): jest.Mocked<JwtService> => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
} as any);
