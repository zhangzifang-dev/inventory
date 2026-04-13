import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ nullable: true })
  spec: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ name: 'cost_price', type: 'decimal', precision: 10, scale: 2 })
  costPrice: number;

  @Column({ name: 'sale_price', type: 'decimal', precision: 10, scale: 2 })
  salePrice: number;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: true })
  status: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
