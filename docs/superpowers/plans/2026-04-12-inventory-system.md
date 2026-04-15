# 进销存管理系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的进销存管理系统，支持商品、采购、销售、库存、折扣、报表等功能，支持多用户多角色权限管理。

**Architecture:** 前后端分离的单体应用。后端采用NestJS模块化架构，前端采用React + Ant Design，数据库使用MySQL，通过TypeORM进行数据访问，JWT进行身份认证。

**Tech Stack:** NestJS, TypeORM, MySQL, React, TypeScript, Ant Design, Zustand, JWT, Docker

---

## 开发阶段概览

### 阶段一：项目初始化与基础架构（Task 1-3）
- Task 1: 初始化后端项目
- Task 2: 创建公共模块（过滤器、拦截器、守卫）
- Task 3: 初始化前端项目

### 阶段二：用户认证与权限模块（Task 4-7）
- Task 4: 创建用户和角色实体
- Task 5: 实现认证模块
- Task 6: 实现用户管理模块
- Task 7: 实现角色和权限管理

### 阶段三：商品管理模块（Task 8-10）
- Task 8: 创建商品相关实体
- Task 9: 实现商品管理服务
- Task 10: 实现商品分类管理

### 阶段四：前端基础架构（Task 11-14）
- Task 11: 创建前端请求服务和状态管理
- Task 12: 创建前端布局组件
- Task 13: 创建登录页面
- Task 14: 创建首页

### 阶段五：采购和销售模块（Task 15-20）
- Task 15: 创建供应商和客户实体
- Task 16: 实现采购管理模块
- Task 17: 实现销售管理模块
- Task 18: 创建折扣相关实体
- Task 19: 实现折扣管理模块
- Task 20: 实现优惠券管理

### 阶段六：库存和报表模块（Task 21-24）
- Task 21: 创建库存相关实体
- Task 22: 实现库存管理模块
- Task 23: 实现报表模块
- Task 24: 实现系统设置模块

### 阶段七：前端页面开发（Task 25-32）
- Task 25: 创建用户管理页面
- Task 26: 创建角色管理页面
- Task 27: 创建商品分类页面
- Task 28: 创建商品列表页面
- Task 29: 创建采购管理页面
- Task 30: 创建销售管理页面
- Task 31: 创建库存管理页面
- Task 32: 创建报表页面

### 阶段八：Docker部署（Task 33-35）
- Task 33: 创建后端Dockerfile
- Task 34: 创建前端Dockerfile
- Task 35: 创建docker-compose配置

---

## 阶段一：项目初始化与基础架构

### Task 1: 初始化后端项目

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/tsconfig.build.json`
- Create: `server/nest-cli.json`
- Create: `server/.env`
- Create: `server/.env.example`
- Create: `server/src/main.ts`
- Create: `server/src/app.module.ts`

- [ ] **Step 1: 创建后端项目目录**

```bash
mkdir -p server/src server/test
```

- [ ] **Step 2: 创建package.json**

创建 `server/package.json`:

```json
{
  "name": "inventory-server",
  "version": "1.0.0",
  "description": "进销存管理系统后端",
  "author": "",
  "private": true,
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.1",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "mysql2": "^3.6.5",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.17"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/passport-jwt": "^4.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  }
}
```

- [ ] **Step 3: 创建tsconfig.json**

创建 `server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 4: 创建nest-cli.json**

创建 `server/nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 5: 创建环境配置文件**

创建 `server/.env`:

```
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=123456
DB_DATABASE=inventory
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=2h
```

创建 `server/.env.example`:

```
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=inventory
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=2h
```

- [ ] **Step 6: 创建应用入口 main.ts**

创建 `server/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
}

bootstrap();
```

- [ ] **Step 7: 创建根模块 app.module.ts**

创建 `server/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

- [ ] **Step 8: 安装依赖并验证**

```bash
cd server
npm install
npm run build
```

Expected: 构建成功，无错误

- [ ] **Step 9: 提交**

```bash
git add server/
git commit -m "feat: initialize backend project with NestJS"
```

---

### Task 2: 创建公共模块

**Files:**
- Create: `server/src/common/filters/http-exception.filter.ts`
- Create: `server/src/common/interceptors/transform.interceptor.ts`
- Create: `server/src/common/decorators/current-user.decorator.ts`
- Create: `server/src/common/dto/pagination.dto.ts`
- Create: `server/src/common/dto/response.dto.ts`

- [ ] **Step 1: 创建异常过滤器**

创建 `server/src/common/filters/http-exception.filter.ts`:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = -1;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        code = (exceptionResponse as any).code || status;
      } else {
        message = exception.message;
        code = status;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      code,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
```

- [ ] **Step 2: 创建响应转换拦截器**

创建 `server/src/common/interceptors/transform.interceptor.ts`:

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'success',
        data,
      })),
    );
  }
}
```

- [ ] **Step 3: 创建当前用户装饰器**

创建 `server/src/common/decorators/current-user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

- [ ] **Step 4: 创建分页DTO**

创建 `server/src/common/dto/pagination.dto.ts`:

```typescript
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
```

- [ ] **Step 5: 创建响应DTO**

创建 `server/src/common/dto/response.dto.ts`:

```typescript
export class ResponseDto<T> {
  code: number;
  message: string;
  data: T;

  constructor(code: number, message: string, data: T) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  static success<T>(data: T, message = 'success'): ResponseDto<T> {
    return new ResponseDto(0, message, data);
  }

  static error<T>(code: number, message: string, data: T = null): ResponseDto<T> {
    return new ResponseDto(code, message, data);
  }
}

export class PaginatedResponseDto<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;

  constructor(list: T[], total: number, page: number, pageSize: number) {
    this.list = list;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
  }
}
```

- [ ] **Step 6: 更新main.ts使用过滤器和拦截器**

更新 `server/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
}

bootstrap();
```

- [ ] **Step 7: 验证构建**

```bash
cd server
npm run build
```

Expected: 构建成功

- [ ] **Step 8: 提交**

```bash
git add server/src/common server/src/main.ts
git commit -m "feat: add common modules (filters, interceptors, decorators)"
```

---

### Task 3: 初始化前端项目

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/vite.config.ts`
- Create: `web/index.html`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/styles/global.css`

- [ ] **Step 1: 创建前端项目目录**

```bash
mkdir -p web/src web/public
```

- [ ] **Step 2: 创建package.json**

创建 `web/package.json`:

```json
{
  "name": "inventory-web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ant-design/icons": "^5.2.6",
    "antd": "^5.12.2",
    "axios": "^1.6.2",
    "dayjs": "^1.11.10",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

- [ ] **Step 3: 创建tsconfig.json**

创建 `web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建vite.config.ts**

创建 `web/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 5: 创建index.html**

创建 `web/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>进销存管理系统</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建main.tsx**

创建 `web/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 7: 创建App.tsx**

创建 `web/src/App.tsx`:

```typescript
function App() {
  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h1>进销存管理系统</h1>
      <p>项目初始化成功</p>
    </div>
  );
}

export default App;
```

- [ ] **Step 8: 创建全局样式**

创建 `web/src/styles/global.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}

#root {
  min-height: 100vh;
}
```

- [ ] **Step 9: 安装依赖并验证**

```bash
cd web
npm install
npm run build
```

Expected: 构建成功

- [ ] **Step 10: 提交**

```bash
git add web/
git commit -m "feat: initialize frontend project with React + Vite + Ant Design"
```

---

## 阶段二：用户认证与权限模块

### Task 4: 创建用户和角色实体

**Files:**
- Create: `server/src/entities/user.entity.ts`
- Create: `server/src/entities/role.entity.ts`
- Create: `server/src/entities/permission.entity.ts`

- [ ] **Step 1: 创建权限实体**

创建 `server/src/entities/permission.entity.ts`:

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 200, nullable: true })
  description: string;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

- [ ] **Step 2: 创建角色实体**

创建 `server/src/entities/role.entity.ts`:

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Permission } from './permission.entity';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 200, nullable: true })
  description: string;

  @ManyToMany(() => Permission, { cascade: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

- [ ] **Step 3: 创建用户实体**

创建 `server/src/entities/user.entity.ts`:

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ default: true })
  status: boolean;

  @ManyToMany(() => Role, { cascade: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

- [ ] **Step 4: 验证构建**

```bash
cd server
npm run build
```

Expected: 构建成功

- [ ] **Step 5: 提交**

```bash
git add server/src/entities/
git commit -m "feat: add user, role and permission entities"
```

---

### Task 5: 实现认证模块

**Files:**
- Create: `server/src/modules/auth/auth.module.ts`
- Create: `server/src/modules/auth/auth.service.ts`
- Create: `server/src/modules/auth/auth.controller.ts`
- Create: `server/src/modules/auth/strategies/jwt.strategy.ts`
- Create: `server/src/modules/auth/dto/login.dto.ts`
- Create: `server/src/common/guards/jwt-auth.guard.ts`

- [ ] **Step 1: 创建登录DTO**

创建 `server/src/modules/auth/dto/login.dto.ts`:

```typescript
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能小于6位' })
  @MaxLength(50)
  password: string;
}
```

- [ ] **Step 2: 创建JWT策略**

创建 `server/src/modules/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (!user.status) {
      throw new UnauthorizedException('用户已被禁用');
    }

    return user;
  }
}
```

- [ ] **Step 3: 创建JWT认证守卫**

创建 `server/src/common/guards/jwt-auth.guard.ts`:

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

- [ ] **Step 4: 创建认证服务**

创建 `server/src/modules/auth/auth.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.status) {
      throw new UnauthorizedException('用户已被禁用');
    }

    const payload = {
      sub: user.id,
      username: user.username,
    };

    const permissions = user.roles.flatMap((role) =>
      role.permissions.map((p) => p.code),
    );

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        roles: user.roles.map((r) => ({ id: r.id, name: r.name })),
        permissions,
      },
    };
  }
}
```

- [ ] **Step 5: 创建认证控制器**

创建 `server/src/modules/auth/auth.controller.ts`:

```typescript
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      permissions: user.roles.flatMap((r) => r.permissions.map((p) => p.code)),
    };
  }
}
```

- [ ] **Step 6: 创建认证模块**

创建 `server/src/modules/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '@/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '2h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

- [ ] **Step 7: 更新AppModule导入AuthModule**

更新 `server/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

- [ ] **Step 8: 验证构建**

```bash
cd server
npm run build
```

Expected: 构建成功

- [ ] **Step 9: 提交**

```bash
git add server/src/modules/auth server/src/common/guards server/src/app.module.ts
git commit -m "feat: implement authentication module with JWT"
```

---

### Task 6: 实现用户管理模块

**Files:**
- Create: `server/src/modules/user/user.module.ts`
- Create: `server/src/modules/user/user.service.ts`
- Create: `server/src/modules/user/user.controller.ts`
- Create: `server/src/modules/user/dto/create-user.dto.ts`
- Create: `server/src/modules/user/dto/update-user.dto.ts`
- Create: `server/src/modules/user/dto/query-user.dto.ts`

- [ ] **Step 1: 创建用户DTO**

创建 `server/src/modules/user/dto/create-user.dto.ts`:

```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  MinLength,
  MaxLength,
  IsArray,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能小于6位' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsArray()
  roleIds?: number[];
}
```

创建 `server/src/modules/user/dto/update-user.dto.ts`:

```typescript
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
```

创建 `server/src/modules/user/dto/query-user.dto.ts`:

```typescript
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class QueryUserDto extends PaginationDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
```

- [ ] **Step 2: 创建用户服务**

创建 `server/src/modules/user/user.service.ts`:

```typescript
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@/entities/user.entity';
import { Role } from '@/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PaginatedResponseDto } from '@/common/dto/response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existUser) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      user.roles = createUserDto.roleIds.map((id) => ({ id } as Role));
    }

    return this.userRepository.save(user);
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResponseDto<User>> {
    const { page = 1, pageSize = 20, username, name, status } = query;

    const where: any = {};
    if (username) where.username = Like(`%${username}%`);
    if (name) where.name = Like(`%${name}%`);
    if (status !== undefined) where.status = status;

    const [list, total] = await this.userRepository.findAndCount({
      where,
      relations: ['roles'],
      select: ['id', 'username', 'name', 'email', 'phone', 'status', 'createdAt'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return new PaginatedResponseDto(list, total, page, pageSize);
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
      select: ['id', 'username', 'name', 'email', 'phone', 'status', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (updateUserDto.roleIds) {
      user.roles = updateUserDto.roleIds.map((roleId) => ({ id: roleId } as Role));
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.userRepository.remove(user);
    return { message: '删除成功' };
  }

  async resetPassword(id: number, password: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.password = await bcrypt.hash(password, 10);
    await this.userRepository.save(user);

    return { message: '密码重置成功' };
  }
}
```

- [ ] **Step 3: 创建用户控制器**

创建 `server/src/modules/user/user.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @Put(':id/reset-password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') password: string,
  ) {
    return this.userService.resetPassword(id, password);
  }
}
```

- [ ] **Step 4: 创建用户模块**

创建 `server/src/modules/user/user.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '@/entities/user.entity';
import { Role } from '@/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

- [ ] **Step 5: 更新AppModule导入UserModule**

更新 `server/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

- [ ] **Step 6: 验证构建**

```bash
cd server
npm run build
```

Expected: 构建成功

- [ ] **Step 7: 提交**

```bash
git add server/src/modules/user server/src/app.module.ts
git commit -m "feat: implement user management module"
```

---

### Task 7: 实现角色权限管理和种子数据

**Files:**
- Create: `server/src/modules/role/role.module.ts`
- Create: `server/src/modules/role/role.service.ts`
- Create: `server/src/modules/role/role.controller.ts`
- Create: `server/src/common/guards/permissions.guard.ts`
- Create: `server/src/common/decorators/require-permissions.decorator.ts`
- Create: `server/src/database/seeds/initial-data.ts`

- [ ] **Step 1: 创建权限守卫和装饰器**
- [ ] **Step 2: 创建角色服务和控制器**
- [ ] **Step 3: 创建初始化种子数据**
- [ ] **Step 4: 更新main.ts添加数据库初始化**
- [ ] **Step 5: 提交**

---

## 阶段三：商品管理模块

### Task 8: 创建商品相关实体

**Files:**
- Create: `server/src/entities/category.entity.ts`
- Create: `server/src/entities/product.entity.ts`

- [ ] **Step 1: 创建分类实体**
- [ ] **Step 2: 创建商品实体**
- [ ] **Step 3: 提交**

### Task 9: 实现商品管理服务

**Files:**
- Create: `server/src/modules/product/product.module.ts`
- Create: `server/src/modules/product/product.service.ts`
- Create: `server/src/modules/product/product.controller.ts`

- [ ] **Step 1: 创建商品DTO**
- [ ] **Step 2: 创建商品服务和控制器**
- [ ] **Step 3: 提交**

### Task 10: 实现商品分类管理

**Files:**
- Create: `server/src/modules/product/category.service.ts`
- Create: `server/src/modules/product/category.controller.ts`

- [ ] **Step 1: 创建分类服务和控制器**
- [ ] **Step 2: 提交**

---

## 阶段四：前端基础架构

### Task 11: 创建前端请求服务和状态管理

**Files:**
- Create: `web/src/services/request.ts`
- Create: `web/src/services/auth.ts`
- Create: `web/src/stores/useUserStore.ts`
- Create: `web/src/types/user.ts`
- Create: `web/src/types/common.ts`

### Task 12: 创建前端布局组件

**Files:**
- Create: `web/src/components/Layout/index.tsx`
- Create: `web/src/components/Layout/Header.tsx`
- Create: `web/src/components/Layout/Sidebar.tsx`
- Create: `web/src/router/index.tsx`

### Task 13: 创建登录页面

**Files:**
- Create: `web/src/pages/login/index.tsx`

### Task 14: 创建首页

**Files:**
- Create: `web/src/pages/home/index.tsx`

---

## 阶段五：采购和销售模块

### Task 15: 创建供应商和客户实体

**Files:**
- Create: `server/src/entities/supplier.entity.ts`
- Create: `server/src/entities/customer.entity.ts`
- Create: `server/src/entities/customer-level.entity.ts`

### Task 16: 实现采购管理模块

**Files:**
- Create: `server/src/entities/purchase-order.entity.ts`
- Create: `server/src/entities/purchase-order-item.entity.ts`
- Create: `server/src/modules/purchase/purchase.module.ts`
- Create: `server/src/modules/purchase/supplier.service.ts`
- Create: `server/src/modules/purchase/purchase-order.service.ts`

### Task 17: 实现销售管理模块

**Files:**
- Create: `server/src/entities/sales-order.entity.ts`
- Create: `server/src/entities/sales-order-item.entity.ts`
- Create: `server/src/modules/sales/sales.module.ts`
- Create: `server/src/modules/sales/customer.service.ts`
- Create: `server/src/modules/sales/sales-order.service.ts`

### Task 18-19: 实现折扣管理模块

**Files:**
- Create: `server/src/entities/discount.entity.ts`
- Create: `server/src/entities/coupon.entity.ts`
- Create: `server/src/modules/discount/discount.module.ts`
- Create: `server/src/modules/discount/discount.service.ts`
- Create: `server/src/modules/discount/coupon.service.ts`

---

## 阶段六：库存和报表模块

### Task 21-22: 实现库存管理模块

**Files:**
- Create: `server/src/entities/inventory.entity.ts`
- Create: `server/src/entities/inventory-log.entity.ts`
- Create: `server/src/modules/inventory/inventory.module.ts`
- Create: `server/src/modules/inventory/inventory.service.ts`

### Task 23: 实现报表模块

**Files:**
- Create: `server/src/modules/report/report.module.ts`
- Create: `server/src/modules/report/report.service.ts`

### Task 24: 实现系统设置模块

**Files:**
- Create: `server/src/entities/system-setting.entity.ts`
- Create: `server/src/entities/operation-log.entity.ts`
- Create: `server/src/modules/system/system.module.ts`

---

## 阶段七：前端页面开发

### Task 25-32: 创建各管理页面

**页面列表:**
- Task 25: 用户管理页面 (`web/src/pages/user/list/`)
- Task 26: 角色管理页面 (`web/src/pages/user/role/`)
- Task 27: 商品分类页面 (`web/src/pages/product/category/`)
- Task 28: 商品列表页面 (`web/src/pages/product/list/`)
- Task 29: 采购管理页面 (`web/src/pages/purchase/`)
- Task 30: 销售管理页面 (`web/src/pages/sales/`)
- Task 31: 库存管理页面 (`web/src/pages/inventory/`)
- Task 32: 报表页面 (`web/src/pages/report/`)

每个页面包含:
- 列表展示（表格）
- 搜索筛选
- 新增/编辑表单
- 删除确认

---

## 阶段八：Docker部署

### Task 33: 创建后端Dockerfile

**Files:**
- Create: `server/Dockerfile`

### Task 34: 创建前端Dockerfile

**Files:**
- Create: `web/Dockerfile`
- Create: `web/nginx.conf`

### Task 35: 创建docker-compose配置

**Files:**
- Create: `docker-compose.yml`
- Create: `.dockerignore`

---

## 执行说明

1. 按阶段顺序执行，每个阶段的任务有依赖关系
2. 每个Task完成后提交代码
3. 遇到问题及时调整计划
4. 优先完成核心功能，扩展功能可后续迭代

---

## 开发环境要求

- Node.js >= 18
- MySQL >= 8.0
- Docker & Docker Compose (部署阶段)
