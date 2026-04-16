import { Repository, ObjectLiteral } from 'typeorm';

export const createMockRepository = <T extends ObjectLiteral>(): jest.Mocked<Repository<T>> => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  findBy: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  softDelete: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
  count: jest.fn(),
  query: jest.fn(),
  createQueryBuilder: jest.fn(),
  metadata: {} as any,
  target: {} as any,
  manager: {} as any,
  queryRunner: {} as any,
} as any);

export const createMockDataSource = () => ({
  createQueryRunner: jest.fn(() => ({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      decrement: jest.fn(),
      increment: jest.fn(),
    },
  })),
});
