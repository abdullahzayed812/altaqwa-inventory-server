import { withTransaction } from '../../infrastructure/database/connection';
import { SupplierRepository } from '../../infrastructure/repositories/SupplierRepository';
import { PurchaseRepository } from '../../infrastructure/repositories/PurchaseRepository';
import { ProductRepository } from '../../infrastructure/repositories/ProductRepository';
import { Supplier, Purchase, SupplierPayment, SupplierLedger, SupplierLedgerType } from '../../core/entities';
import { CreateSupplierDto, UpdateSupplierDto, CreatePurchaseDto, UpdatePurchaseDto, AddSupplierPaymentDto, UpdateSupplierPaymentDto } from '../../core/dto';

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
    await supplierRepo.delete(id);
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

      return (await purchaseRepo.findById(purchase.id, conn))!;
    });
  }

  async updatePurchase(id: number, data: UpdatePurchaseDto): Promise<Purchase> {
    return withTransaction(async (conn) => {
      const purchase = await purchaseRepo.findById(id, conn);
      if (!purchase) throw new Error('Purchase not found');

      const oldTotal = purchase.totalAmount;
      const supplierId = purchase.supplierId;

      // Reverse old stock changes
      for (const item of purchase.items ?? []) {
        await productRepo.updateStock(item.productId, -item.quantity, conn);
      }

      // Remove old items and insert new
      await purchaseRepo.deletePurchaseItems(id, conn);

      let newTotal = 0;
      for (const item of data.items) {
        newTotal += item.quantity * item.price;
        await purchaseRepo.createItem(
          { purchaseId: id, productId: item.productId, quantity: item.quantity, price: item.price },
          conn
        );
        await productRepo.updateStock(item.productId, item.quantity, conn);
      }

      await purchaseRepo.updatePurchaseTotalAmount(id, newTotal, conn);

      // Update ledger entry
      const ledgerEntry = await purchaseRepo.findLedgerByReference(supplierId, id, SupplierLedgerType.PURCHASE, conn);
      if (ledgerEntry) {
        await purchaseRepo.updateLedgerEntry(ledgerEntry.id, newTotal, conn);
      }

      // Adjust supplier balance by delta
      const delta = newTotal - oldTotal;
      await supplierRepo.updateBalance(supplierId, delta, conn);

      return (await purchaseRepo.findById(id, conn))!;
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

  async updatePayment(id: number, data: UpdateSupplierPaymentDto): Promise<SupplierPayment> {
    return withTransaction(async (conn) => {
      const payment = await purchaseRepo.findSupplierPaymentById(id, conn);
      if (!payment) throw new Error('Supplier payment not found');

      const oldAmount = payment.amount;
      const newAmount = data.amount;

      await purchaseRepo.updateSupplierPayment(id, data, conn);

      // Update ledger entry
      const ledgerEntry = await purchaseRepo.findLedgerByReference(payment.supplierId, id, SupplierLedgerType.PAYMENT, conn);
      if (ledgerEntry) {
        await purchaseRepo.updateLedgerEntry(ledgerEntry.id, newAmount, conn);
      }

      // Adjust supplier balance: reverse old payment effect, apply new
      const delta = oldAmount - newAmount; // was: balance -= old; now: balance -= new → net: balance += (old - new)
      await supplierRepo.updateBalance(payment.supplierId, delta, conn);

      return (await purchaseRepo.findSupplierPaymentById(id, conn))!;
    });
  }

  async getLedger(supplierId: number, filters: { type?: string; startDate?: string; endDate?: string } = {}): Promise<SupplierLedger[]> {
    return purchaseRepo.getLedger(supplierId, filters);
  }

  async getAllPayments(): Promise<SupplierPayment[]> {
    return purchaseRepo.findAllSupplierPayments();
  }

  async getSupplierPaymentById(id: number): Promise<SupplierPayment | null> {
    return purchaseRepo.findSupplierPaymentById(id);
  }

  async getPurchaseById(id: number): Promise<Purchase | null> {
    return purchaseRepo.findById(id);
  }

  async getAllPurchases(): Promise<Purchase[]> {
    return purchaseRepo.findAll();
  }
}
