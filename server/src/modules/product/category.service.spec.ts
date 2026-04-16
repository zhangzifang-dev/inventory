import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { createMockRepository } from '../../common/test/mock-repository';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: ReturnType<typeof createMockRepository<Category>>;

  const createMockCategory = (props: Partial<Category> = {}): Category => ({
    id: 1,
    name: 'Test Category',
    parentId: undefined,
    sort: 0,
    createdAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    parent: null,
    children: [],
    ...props,
  } as unknown as Category);

  beforeEach(async () => {
    repository = createMockRepository<Category>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: 'CategoryRepository',
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    (service as any).categoryRepository = repository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a category without parentId', async () => {
      const dto: CreateCategoryDto = { name: 'Test Category' };
      const category = createMockCategory();

      repository.create.mockReturnValue(category);
      repository.save.mockResolvedValue(category);

      const result = await service.create(dto);

      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(category);
      expect(result).toEqual(category);
    });

    it('should create a category with valid parentId', async () => {
      const dto: CreateCategoryDto = { name: 'Child Category', parentId: 1 };
      const parent = createMockCategory({ id: 1, name: 'Parent Category' });
      const child = createMockCategory({ id: 2, name: 'Child Category', parentId: 1 });

      repository.findOne.mockResolvedValueOnce(parent);
      repository.create.mockReturnValue(child);
      repository.save.mockResolvedValue(child);

      const result = await service.create(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(child);
    });

    it('should throw BadRequestException when parent not found', async () => {
      const dto: CreateCategoryDto = { name: 'Child Category', parentId: 999 };

      repository.findOne.mockResolvedValueOnce(null);

      await expect(service.create(dto)).rejects.toThrow('父分类不存在');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no categories', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: { deletedAt: expect.anything() },
        order: { sort: 'ASC', id: 'ASC' },
      });
      expect(result).toEqual([]);
    });

    it('should return categories as tree structure', async () => {
      const rootCategory = { id: 1, name: 'Parent', parentId: null, sort: 0, createdAt: new Date(), deletedAt: null, deletedBy: null, parent: null, children: [] } as unknown as Category;
      const categories = [
        rootCategory,
        createMockCategory({ id: 2, name: 'Child 1', parentId: 1 }),
        createMockCategory({ id: 3, name: 'Child 2', parentId: 1 }),
        createMockCategory({ id: 4, name: 'Grandchild', parentId: 2 }),
      ];

      repository.find.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children[0].id).toBe(2);
      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].id).toBe(4);
      expect(result[0].children[1].id).toBe(3);
    });

    it('should handle orphan categories (parent not in list)', async () => {
      const rootCategory = { id: 1, name: 'Root', parentId: null, sort: 0, createdAt: new Date(), deletedAt: null, deletedBy: null, parent: null, children: [] } as unknown as Category;
      const categories = [
        rootCategory,
        createMockCategory({ id: 2, name: 'Orphan', parentId: 999 }),
      ];

      repository.find.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const category = createMockCategory();

      repository.findOne.mockResolvedValue(category);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
        relations: ['children'],
      });
      expect(result).toEqual(category);
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow('分类不存在');
    });
  });

  describe('update', () => {
    it('should update a category successfully', async () => {
      const category = createMockCategory({ name: 'Old Name' });
      const dto: UpdateCategoryDto = { name: 'New Name' };
      const updated = createMockCategory({ name: 'New Name' });

      repository.findOne.mockResolvedValueOnce(category);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(1, dto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe('New Name');
    });

    it('should update parentId to null', async () => {
      const category = createMockCategory({ parentId: 2 });
      const dto: UpdateCategoryDto = { parentId: undefined };
      const updated = { ...createMockCategory(), parentId: null } as unknown as Category;

      repository.findOne.mockResolvedValueOnce(category);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(1, dto);

      expect(result.parentId).toBeNull();
    });

    it('should update parentId to a valid parent', async () => {
      const category = createMockCategory();
      const newParent = createMockCategory({ id: 2, name: 'New Parent' });
      const dto: UpdateCategoryDto = { parentId: 2 };
      const updated = createMockCategory({ parentId: 2 });

      repository.findOne.mockResolvedValueOnce(category);
      repository.findOne.mockResolvedValueOnce(newParent);
      repository.save.mockResolvedValue(updated);

      const result = await service.update(1, dto);

      expect(result.parentId).toBe(2);
    });

    it('should throw NotFoundException when category not found', async () => {
      const dto: UpdateCategoryDto = { name: 'New Name' };

      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, dto)).rejects.toThrow('分类不存在');
    });

    it('should throw BadRequestException when setting self as parent', async () => {
      const category = createMockCategory();
      const dto: UpdateCategoryDto = { parentId: 1 };

      repository.findOne.mockResolvedValue(category);

      await expect(service.update(1, dto)).rejects.toThrow('不能将分类设为自己的子分类');
    });

    it('should throw BadRequestException when parent not found', async () => {
      const category = createMockCategory();
      const dto: UpdateCategoryDto = { parentId: 999 };

      repository.findOne
        .mockResolvedValueOnce(category)
        .mockResolvedValueOnce(null);

      await expect(service.update(1, dto)).rejects.toThrow('父分类不存在');
    });
  });

  describe('remove', () => {
    it('should soft delete a category without children', async () => {
      const category = createMockCategory({ children: [] });

      repository.findOne.mockResolvedValue(category);
      repository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1, 100);

      expect(repository.update).toHaveBeenCalledWith(1, {
        deletedAt: expect.any(Date),
        deletedBy: 100,
      });
    });

    it('should soft delete a category with children array undefined', async () => {
      const category = createMockCategory({ children: undefined });

      repository.findOne.mockResolvedValue(category);
      repository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1, 100);

      expect(repository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 100)).rejects.toThrow('分类不存在');
    });

    it('should throw BadRequestException when category has active children', async () => {
      const child = createMockCategory({ id: 2, name: 'Child' });
      const category = createMockCategory({ children: [child] });

      repository.findOne.mockResolvedValue(category);

      await expect(service.remove(1, 100)).rejects.toThrow('该分类下存在子分类，无法删除');
    });

    it('should allow deletion when children are soft deleted', async () => {
      const deletedChild = createMockCategory({ id: 2, name: 'Deleted Child', deletedAt: new Date() });
      const category = createMockCategory({ children: [deletedChild] });

      repository.findOne.mockResolvedValue(category);
      repository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1, 100);

      expect(repository.update).toHaveBeenCalled();
    });
  });
});
