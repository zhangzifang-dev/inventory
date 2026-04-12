import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';

export enum InventoryLogType {
  PURCHASE = 'purchase',
  SALES = 'sales',
  ADJUSTMENT = 'adjustment',
}

@Entity('inventory_logs')
export class InventoryLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({
    type: 'enum',
    enum: InventoryLogType,
  })
  type: InventoryLogType;

  @Column()
  quantity: number;

  @Column({ name: 'before_qty' })
  beforeQty: number;

  @Column({ name: 'after_qty' })
  afterQty: number;

  @Column({ name: 'order_id', nullable: true })
  orderId: number;

  @Column({ nullable: true, type: 'text' })
  remark: string;

  @Column({ name: 'created_by_id' })
  createdById: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Product)
  product: Product;

  @ManyToOne(() => User)
  createdBy: User;
}
