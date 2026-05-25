import { withTransaction } from '../../infrastructure/database/connection';
import { SupplierRepository } from '../../infrastructure/repositories/SupplierRepository';
import { PurchaseRepository } from '../../infrastructure/repositories/PurchaseRepository';
import { ProductRepository } from '../../infrastructure/repositories/ProductRepository';
import { Supplier, Purchase, SupplierPayment, SupplierLedger, SupplierLedgerType } from '../../core/entities';
import { CreateSupplierDto, UpdateSupplierDto, CreatePurchaseDto, AddSupplierPaymentDto } from '../../core/dto';

const supplierRepo = new SupplierRepository();
const purchaseRepo = new PurchaseRepository();
const productRepo = new ProductRepository();

export class SupplierUseCases {
  async getAllSuppliers(): Promise<Supplier[]> {
    return supplierRepo.findAll();
  }

  async getSupplierById(id: number): Promise<Supplier | null> {
    return supplierRepo.findById(id);
  }

  async addSupplier(data: CreateSupplierDto): Promise<Supplier> {
    return supplierRepo.create(data);
  }

  async updateSupplier(id: number, data: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await supplierRepo.findById(id);
    if (!supplier) throw new Error('Supplier not found');
    return supplierRepo.update(id, data);
  }

  async deleteSupplier(id: number): Promise<void> {
    const supplier = await supplierRepo.findById(id);
    if (!supplier) throw new Error('Supplier not found');
    try {
      await supplierRepo.delete(id);
    } catch (err: any) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new Error('لا يمكن حذف هذا المورد لأن له مشتريات أو مدفوعات مرتبطة');
      }
      throw err;
    }
  }

  async createPurchase(data: CreatePurchaseDto): Promise<Purchase> {
    return withTransaction(async (conn) => {
      let totalAmount = 0;
      data.items.forEach(item => { totalAmount += item.quantity * item.price; });

      const purchase = await purchaseRepo.create({ supplierId: data.supplierId, totalAmount }, conn);

      for (const item of data.items) {
        await purchaseRepo.createItem(
          { purchaseId: purchase.id, productId: item.productId, quantity: item.quantity, price: item.price },
          conn
        );
        await productRepo.updateStock(item.productId, item.quantity, conn);
      }

      await purchaseRepo.createLedgerEntry(
        { supplierId: data.supplierId, type: SupplierLedgerType.PURCHASE, amount: totalAmount, referenceId: purchase.id },
        conn
      );

      await supplierRepo.updateBalance(data.supplierId, totalAmount, conn);

      return purchase;
    });
  }

  async addPayment(data: AddSupplierPaymentDto): Promise<SupplierPayment> {
    return withTransaction(async (conn) => {
      const payment = await purchaseRepo.createSupplierPayment(
        { supplierId: data.supplierId, amount: data.amount, method: data.method, senderName: data.senderName, note: data.note },
        conn
      );

      await purchaseRepo.createLedgerEntry(
        { supplierId: data.supplierId, type: SupplierLedgerType.PAYMENT, amount: data.amount, referenceId: payment.id },
        conn
      );

      await supplierRepo.updateBalance(data.supplierId, -data.amount, conn);

      return payment;
    });
  }

  async getLedger(supplierId: number, filters: { type?: string; startDate?: string; endDate?: string } = {}): Promise<SupplierLedger[]> {
    return purchaseRepo.getLedger(supplierId, filters);
  }

  async getAllPayments(): Promise<SupplierPayment[]> {
    return purchaseRepo.findAllSupplierPayments();
  }

  async getPurchaseById(id: number): Promise<Purchase | null> {
    return purchaseRepo.findById(id);
  }

  async getAllPurchases(): Promise<Purchase[]> {
    return purchaseRepo.findAll();
  }
}
