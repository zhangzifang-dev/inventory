import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { User } from './user.entity';
import { SalesOrderItem } from './sales-order-item.entity';

export enum SalesOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_no', unique: true })
  orderNo: string;

  @Column({ name: 'customer_id' })
  customerId: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'coupon_discount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  couponDiscount: number;

  @Column({ name: 'final_amount', type: 'decimal', precision: 10, scale: 2 })
  finalAmount: number;

  @Column({
    type: 'enum',
    enum: SalesOrderStatus,
    default: SalesOrderStatus.DRAFT,
  })
  status: SalesOrderStatus;

  @Column({ name: 'created_by_id' })
  createdById: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @OneToMany(() => SalesOrderItem, (item) => item.order, { cascade: true })
  items: SalesOrderItem[];
}
