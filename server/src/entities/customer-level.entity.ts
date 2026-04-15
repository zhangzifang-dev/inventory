import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_levels')
export class CustomerLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'min_amount', type: 'decimal', precision: 10, scale: 2 })
  minAmount: number;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2 })
  discountPercent: number;

  @Column({ default: 0 })
  level: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Index()
  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy: number;

  @OneToMany(() => Customer, (customer) => customer.level)
  customers: Customer[];
}
