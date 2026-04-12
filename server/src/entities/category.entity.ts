import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: number;

  @Column({ default: 0 })
  sort: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Category, (category) => category.children)
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];
}
