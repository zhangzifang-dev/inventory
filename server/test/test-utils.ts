import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export async function createTestModule(
  entities: any[],
  providers: any[] = [],
): Promise<TestingModule> {
  const module = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities,
        synchronize: true,
        dropSchema: true,
      }),
      TypeOrmModule.forFeature(entities),
    ],
    providers,
  }).compile();

  return module;
}

export async function cleanupDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query('PRAGMA foreign_keys = OFF');
  
  const entities = dataSource.entityMetadatas;
  const tableNames = entities.map((e) => e.tableName);

  if (tableNames.includes('user_roles')) {
    await dataSource.query('DELETE FROM user_roles');
  }
  if (tableNames.includes('role_permissions')) {
    await dataSource.query('DELETE FROM role_permissions');
  }

  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName}`);
  }
  
  await dataSource.query('PRAGMA foreign_keys = ON');
}

export async function closeDatabase(dataSource: DataSource): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
