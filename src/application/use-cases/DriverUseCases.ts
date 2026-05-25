import { withTransaction } from '../../infrastructure/database/connection';
import { DriverRepository } from '../../infrastructure/repositories/DriverRepository';
import { Driver, DriverLedger, DriverLedgerType } from '../../core/entities';
import { CreateDriverDto, UpdateDriverDto, AddDriverPaymentDto, AddDriverDebtDto } from '../../core/dto';

const repo = new DriverRepository();

export class DriverUseCases {
  async getAllDrivers(): Promise<Driver[]> {
    return repo.findAll();
  }

  async getDriverById(id: number): Promise<Driver | null> {
    return repo.findById(id);
  }

  async addDriver(data: CreateDriverDto): Promise<Driver> {
    return repo.create(data);
  }

  async updateDriver(id: number, data: UpdateDriverDto): Promise<Driver> {
    const driver = await repo.findById(id);
    if (!driver) throw new Error('Driver not found');
    return repo.update(id, data);
  }

  async deleteDriver(id: number): Promise<void> {
    const driver = await repo.findById(id);
    if (!driver) throw new Error('Driver not found');
    try {
      await repo.delete(id);
    } catch (err: any) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new Error('لا يمكن حذف هذا السائق لأن له طلبات أو مدفوعات مرتبطة');
      }
      throw err;
    }
  }

  async updateAvailability(id: number, isAvailable: boolean): Promise<Driver> {
    return repo.updateAvailability(id, isAvailable);
  }

  async addPayment(data: AddDriverPaymentDto): Promise<void> {
    const driver = await repo.findById(data.driverId);
    if (!driver) throw new Error('Driver not found');
    await withTransaction(async (conn) => {
      await repo.createPayment({ driverId: data.driverId, amount: data.amount, notes: data.notes }, conn);
      await repo.createLedgerEntry(
        { driverId: data.driverId, type: DriverLedgerType.PAYMENT, amount: data.amount, notes: data.notes },
        conn
      );
      await repo.updateBalance(data.driverId, -data.amount, conn);
    });
  }

  async addDebt(data: AddDriverDebtDto): Promise<void> {
    const driver = await repo.findById(data.driverId);
    if (!driver) throw new Error('Driver not found');
    await withTransaction(async (conn) => {
      await repo.createLedgerEntry(
        { driverId: data.driverId, type: DriverLedgerType.DEBT, amount: data.amount, notes: data.notes },
        conn
      );
      await repo.updateBalance(data.driverId, data.amount, conn);
    });
  }

  async getLedger(driverId: number): Promise<DriverLedger[]> {
    return repo.getLedger(driverId);
  }
}
