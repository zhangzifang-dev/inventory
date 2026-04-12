import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { CustomerLevel } from './customer-level.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'level_id', nullable: true })
  levelId: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ default: true })
  status: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => CustomerLevel, (level) => level.customers)
  level: CustomerLevel;
}
