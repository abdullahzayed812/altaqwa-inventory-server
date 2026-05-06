import { DriverRepository } from '../../infrastructure/repositories/DriverRepository';
import { Driver } from '../../core/entities';
import { CreateDriverDto } from '../../core/dto';

const repo = new DriverRepository();

export class DriverUseCases {
  async getAllDrivers(): Promise<Driver[]> {
    return repo.findAll();
  }

  async addDriver(data: CreateDriverDto): Promise<Driver> {
    return repo.create(data);
  }

  async updateAvailability(id: number, isAvailable: boolean): Promise<Driver> {
    return repo.updateAvailability(id, isAvailable);
  }
}
