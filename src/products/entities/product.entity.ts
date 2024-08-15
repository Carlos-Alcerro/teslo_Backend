import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
import { User } from 'src/auth/entities/user.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', {
    unique: true,
  })
  title: string;

  @Column('float', {
    default: 0,
  })
  price: number;

  //OTRA FORMA DE AGREGAR PROPIEDADES
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column('text', {
    unique: true,
  })
  slugs: string;

  @Column('int', {
    default: 0,
  })
  stock: number;

  @Column('text', {
    array: true,
  })
  sizes: string[];

  @Column('text')
  gender: string;

  @Column('text', {
    array: true,
    default: [],
  })
  tags: string[];

  @ManyToOne(() => User, (user) => user.product, { eager: true })
  user: User;

  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];

  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slugs) {
      this.slugs = this.title;
    }
    this.slugs = this.title
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
  @BeforeUpdate()
  checkUpdate() {
    this.slugs = this.title
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
