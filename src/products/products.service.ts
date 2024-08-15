import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagimation.dto';
import { validate as IsUUID } from 'uuid';
import { ProductImage } from './entities/product-image.entity';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imagesRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto, user: User) {
    try {
      /*    if (!createProductDto.slugs) {
        createProductDto.slugs = createProductDto.title
          .toLowerCase()
          .replaceAll(' ', '_')
          .replaceAll("'", '');
      } */
      const { images = [], ...productDetails } = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.imagesRepository.create({ url: image }),
        ),
        user: user,
      });
      await this.productRepository.save(product);

      return { ...product, images: images };
    } catch (error) {
      this.handleExeption(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
    });
    if (!products || products.length === 0)
      throw new NotFoundException(
        'No se encontaron productos en la Base de Datos',
      );
    return products.map((product) => ({
      ...product,
      images: product.images.map((img) => img.url),
    }));
  }

  async findOne(term: string) {
    let product: Product;
    if (IsUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('UPPER(title)=:title or slugs=:slugs', {
          title: term.toUpperCase(),
          slugs: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }

    if (!product)
      throw new BadRequestException(
        `No se encontro el producto con el termino: ${term}`,
      );
    return product;
  }

  async findOnePlain(id: string) {
    const { images = [], ...rest } = await this.findOne(id);
    return {
      ...rest,
      images: images.map((img) => img.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({
      id,
      ...toUpdate,
      images: [],
    });

    if (!product)
      throw new BadRequestException(`No se encuentra el producto con ID:${id}`);

    //Create Query Runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map((img) =>
          this.imagesRepository.create({ url: img }),
        );
      }

      product.user = user;
      await queryRunner.manager.save(product);

      /* await this.productRepository.save(product); */

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExeption(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    const deleteProd = await this.productRepository.delete(id);
    if (!deleteProd.affected) {
      throw new BadRequestException(
        `No se pudo eliminar el producto con el ID: ${id}`,
      );
    }

    return `Exito, producto con ID:${id} eliminado`;
  }

  private handleExeption(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Hubo un error interno en el servidor',
    );
  }
}
