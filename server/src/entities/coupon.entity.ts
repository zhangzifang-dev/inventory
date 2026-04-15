import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum CouponType {
  FULL_REDUCTION = 'full_reduction',
  DISCOUNT = 'discount',
  CASH = 'cash',
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.FULL_REDUCTION,
  })
  type: CouponType;

  @Column({ name: 'min_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minAmount: number;

  @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ name: 'total_count', default: 0 })
  totalCount: number;

  @Column({ name: 'used_count', default: 0 })
  usedCount: number;

  @Column({ name: 'start_time', type: 'datetime' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime' })
  endTime: Date;

  @Column({ default: true })
  status: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Index()
  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy: number;
}
