import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: '分类名称不能为空' })
  name: string;

  @IsNumber()
  @IsOptional()
  parentId?: number;

  @IsNumber()
  @IsOptional()
  sort?: number;
}
