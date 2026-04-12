import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    if (dto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('父分类不存在');
      }
    }

    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      order: { sort: 'ASC', id: 'ASC' },
    });

    return this.buildTree(categories);
  }

  private buildTree(categories: Category[]): Category[] {
    const map = new Map<number, Category>();
    const roots: Category[] = [];

    categories.forEach((category) => {
      map.set(category.id, { ...category, children: [] });
    });

    categories.forEach((category) => {
      const node = map.get(category.id)!;
      if (category.parentId === null) {
        roots.push(node);
      } else {
        const parent = map.get(category.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return roots;
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children'],
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('不能将分类设为自己的子分类');
      }
      if (dto.parentId !== null) {
        const parent = await this.categoryRepository.findOne({
          where: { id: dto.parentId },
        });
        if (!parent) {
          throw new BadRequestException('父分类不存在');
        }
      }
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children'],
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    if (category.children && category.children.length > 0) {
      throw new BadRequestException('该分类下存在子分类，无法删除');
    }

    await this.categoryRepository.remove(category);
  }
}
