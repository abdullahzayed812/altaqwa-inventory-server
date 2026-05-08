import { ProductRepository } from '../../infrastructure/repositories/ProductRepository';
import { Product } from '../../core/entities';
import { CreateProductDto } from '../../core/dto';

const repo = new ProductRepository();

export class InventoryUseCases {
  async getAllProducts(): Promise<Product[]> {
    return repo.findAll();
  }

  async addProduct(data: CreateProductDto): Promise<Product> {
    return repo.create(data);
  }

  async updateStock(id: number, quantity: number): Promise<Product> {
    const product = await repo.findById(id);
    if (!product) throw new Error('Product not found');
    await repo.updateStock(id, quantity);
    return (await repo.findById(id))!;
  }

  async updateProduct(id: number, data: Partial<CreateProductDto>): Promise<Product> {
    const product = await repo.findById(id);
    if (!product) throw new Error('Product not found');
    return repo.update(id, data);
  }
}
