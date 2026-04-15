import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Product } from '../../entities/product.entity';
import { Category } from '../../entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category])],
  controllers: [ProductController, CategoryController],
  providers: [ProductService, CategoryService],
  exports: [ProductService, CategoryService],
})
export class ProductModule {}
