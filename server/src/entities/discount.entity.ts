import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

export enum DiscountScope {
  ORDER = 'order',
  ITEM = 'item',
}

@Entity('discounts')
export class Discount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: DiscountScope,
    name: 'scope',
    default: DiscountScope.ORDER,
  })
  scope: DiscountScope;

  @Column({
    type: 'enum',
    enum: DiscountType,
    name: 'discount_type',
    default: DiscountType.PERCENT,
  })
  discountType: DiscountType;

  @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

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
