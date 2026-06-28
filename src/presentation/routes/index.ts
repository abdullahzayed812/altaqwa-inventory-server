import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { InventoryController } from '../controllers/InventoryController';
import { OrderController } from '../controllers/OrderController';
import { PaymentController } from '../controllers/PaymentController';
import { SupplierController } from '../controllers/SupplierController';
import { DashboardController } from '../controllers/DashboardController';
import { ReportController } from '../controllers/ReportController';

const router = Router();
const customers = new CustomerController();
const inventory = new InventoryController();
const orders = new OrderController();
const payments = new PaymentController();
const suppliers = new SupplierController();
const dashboard = new DashboardController();
const reports = new ReportController();

// Customers
router.get('/customers', (req, res) => customers.getAll(req, res));
router.post('/customers', (req, res) => customers.create(req, res));
router.get('/customers/:id', (req, res) => customers.getById(req, res));
router.put('/customers/:id', (req, res) => customers.update(req, res));
router.delete('/customers/:id', (req, res) => customers.delete(req, res));
router.get('/customers/:id/payments', (req, res) => customers.getPayments(req, res));
router.get('/customers/:id/orders', (req, res) => customers.getOrders(req, res));

// Products
router.get('/products', (req, res) => inventory.getAll(req, res));
router.post('/products', (req, res) => inventory.create(req, res));
router.put('/products/:id', (req, res) => inventory.update(req, res));
router.patch('/products/:id/stock', (req, res) => inventory.updateStock(req, res));

// Orders
router.get('/orders', (req, res) => orders.getAll(req, res));
router.post('/orders', (req, res) => orders.create(req, res));
router.patch('/orders/:id/status', (req, res) => orders.updateStatus(req, res));

// Payments (customer payments)
router.get('/payments', (req, res) => payments.getAll(req, res));
router.post('/payments', (req, res) => payments.create(req, res));
router.put('/payments/:id', (req, res) => payments.update(req, res));

// Suppliers
router.get('/suppliers', (req, res) => suppliers.getAll(req, res));
router.post('/suppliers', (req, res) => suppliers.create(req, res));
router.get('/suppliers/payments/all', (req, res) => suppliers.getAllPayments(req, res));
router.get('/suppliers/purchases/all', (req, res) => suppliers.getAllPurchases(req, res));
router.get('/suppliers/:id', (req, res) => suppliers.getById(req, res));
router.put('/suppliers/:id', (req, res) => suppliers.update(req, res));
router.delete('/suppliers/:id', (req, res) => suppliers.delete(req, res));
router.post('/suppliers/:id/payments', (req, res) => suppliers.addPayment(req, res));
router.get('/suppliers/:id/ledger', (req, res) => suppliers.getLedger(req, res));

// Purchases
router.post('/purchases', (req, res) => suppliers.createPurchase(req, res));
router.get('/purchases/:id', (req, res) => suppliers.getPurchaseById(req, res));
router.put('/purchases/:id', (req, res) => suppliers.updatePurchase(req, res));

// Supplier payments
router.get('/supplier-payments/:id', (req, res) => suppliers.getPaymentById(req, res));
router.put('/supplier-payments/:id', (req, res) => suppliers.updatePayment(req, res));

// Dashboard & Reports
router.get('/dashboard/stats', (req, res) => dashboard.getStats(req, res));
router.get('/reports', (req, res) => reports.getReportData(req, res));

export default router;
