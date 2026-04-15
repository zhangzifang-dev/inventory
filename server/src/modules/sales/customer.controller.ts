import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('客户管理')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: '创建客户' })
  async create(@Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取客户列表' })
  async findAll(@Query() query: QueryCustomerDto) {
    return this.customerService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取客户详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新客户' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除客户' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id;
    return this.customerService.remove(id, userId);
  }
}
