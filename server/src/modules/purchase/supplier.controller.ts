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
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Supplier } from '../../entities/supplier.entity';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  async create(@Body() dto: CreateSupplierDto): Promise<Supplier> {
    return this.supplierService.create(dto);
  }

  @Get()
  async findAll(@Query() query: QuerySupplierDto) {
    return this.supplierService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Supplier> {
    return this.supplierService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto,
  ): Promise<Supplier> {
    return this.supplierService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.supplierService.remove(id);
  }
}
