import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CustomerLevelService } from './customer-level.service';
import { CreateCustomerLevelDto } from './dto/create-customer-level.dto';
import { UpdateCustomerLevelDto } from './dto/update-customer-level.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CustomerLevel } from '../../entities/customer-level.entity';

@Controller('customer-levels')
@UseGuards(JwtAuthGuard)
export class CustomerLevelController {
  constructor(private readonly customerLevelService: CustomerLevelService) {}

  @Post()
  async create(@Body() dto: CreateCustomerLevelDto): Promise<CustomerLevel> {
    return this.customerLevelService.create(dto);
  }

  @Get()
  async findAll(): Promise<CustomerLevel[]> {
    return this.customerLevelService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CustomerLevel> {
    return this.customerLevelService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerLevelDto,
  ): Promise<CustomerLevel> {
    return this.customerLevelService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.customerLevelService.remove(id);
  }
}
