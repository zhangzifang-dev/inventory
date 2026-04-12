import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { Product } from './product.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => PurchaseOrder, (order) => order.items, { onDelete: 'CASCADE' })
  order: PurchaseOrder;

  @ManyToOne(() => Product)
  product: Product;
}
