import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('供应商管理')
@ApiBearerAuth('JWT-auth')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @ApiOperation({ summary: '创建供应商' })
  async create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取供应商列表' })
  async findAll(@Query() query: QuerySupplierDto) {
    return this.supplierService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取供应商详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新供应商' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSupplierDto) {
    return this.supplierService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除供应商' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.remove(id);
  }
}
