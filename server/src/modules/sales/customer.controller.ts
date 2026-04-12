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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Customer } from '../../entities/customer.entity';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async create(@Body() dto: CreateCustomerDto): Promise<Customer> {
    return this.customerService.create(dto);
  }

  @Get()
  async findAll(@Query() query: QueryCustomerDto) {
    return this.customerService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Customer> {
    return this.customerService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.customerService.remove(id);
  }
}
