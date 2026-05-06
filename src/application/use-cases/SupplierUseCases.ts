import { withTransaction } from '../../infrastructure/database/connection';
import { SupplierRepository } from '../../infrastructure/repositories/SupplierRepository';
import { PurchaseRepository } from '../../infrastructure/repositories/PurchaseRepository';
import { ProductRepository } from '../../infrastructure/repositories/ProductRepository';
import { Supplier, Purchase, SupplierPayment, SupplierLedger, SupplierLedgerType } from '../../core/entities';
import { CreateSupplierDto, CreatePurchaseDto, AddSupplierPaymentDto } from '../../core/dto';

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
        { supplierId: data.supplierId, amount: data.amount, note: data.note },
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

  async getLedger(supplierId: number): Promise<SupplierLedger[]> {
    return purchaseRepo.getLedger(supplierId);
  }

  async getAllPayments(): Promise<SupplierPayment[]> {
    return purchaseRepo.findAllSupplierPayments();
  }

  async getAllPurchases(): Promise<Purchase[]> {
    return purchaseRepo.findAll();
  }
}
