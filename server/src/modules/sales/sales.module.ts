import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerLevelController } from './customer-level.controller';
import { CustomerLevelService } from './customer-level.service';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { SalesOrderController } from './sales-order.controller';
import { SalesOrderService } from './sales-order.service';
import { CustomerLevel } from '../../entities/customer-level.entity';
import { Customer } from '../../entities/customer.entity';
import { SalesOrder } from '../../entities/sales-order.entity';
import { SalesOrderItem } from '../../entities/sales-order-item.entity';
import { Product } from '../../entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerLevel, Customer, SalesOrder, SalesOrderItem, Product])],
  controllers: [CustomerLevelController, CustomerController, SalesOrderController],
  providers: [CustomerLevelService, CustomerService, SalesOrderService],
  exports: [CustomerLevelService, CustomerService, SalesOrderService],
})
export class SalesModule {}
