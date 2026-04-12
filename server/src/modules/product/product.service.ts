import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginatedResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const existingProduct = await this.productRepository.findOne({
      where: { sku: dto.sku },
    });

    if (existingProduct) {
      throw new BadRequestException('SKU已存在');
    }

    const product = this.productRepository.create(dto);
    return this.productRepository.save(product);
  }

  async findAll(query: QueryProductDto): Promise<PaginatedResponseDto<Product>> {
    const where: any = {};
    
    if (query.sku) {
      where.sku = Like(`%${query.sku}%`);
    }
    if (query.name) {
      where.name = Like(`%${query.name}%`);
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [list, total] = await this.productRepository.findAndCount({
      where,
      relations: ['category'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return PaginatedResponseDto.create(list, total, page, pageSize);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    return product;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    if (dto.sku && dto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: dto.sku },
      });
      if (existingProduct) {
        throw new BadRequestException('SKU已存在');
      }
    }

    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    await this.productRepository.remove(product);
  }
}
