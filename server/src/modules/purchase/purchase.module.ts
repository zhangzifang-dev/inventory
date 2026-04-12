import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';
import { Supplier } from '../../entities/supplier.entity';
import { PurchaseOrder } from '../../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../entities/purchase-order-item.entity';
import { Product } from '../../entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, PurchaseOrder, PurchaseOrderItem, Product])],
  controllers: [SupplierController, PurchaseOrderController],
  providers: [SupplierService, PurchaseOrderService],
  exports: [SupplierService, PurchaseOrderService],
})
export class PurchaseModule {}
