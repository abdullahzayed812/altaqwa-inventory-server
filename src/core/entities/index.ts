export enum OrderStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK',
}

export enum SupplierLedgerType {
  PURCHASE = 'PURCHASE',
  PAYMENT = 'PAYMENT',
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  totalDebt: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  totalBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  imagePath: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: number;
  name: string;
  phone: string | null;
  vehiclePlate: string | null;
  vehicleDetails: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: number;
  deliveryFeePerTon?: number;
  totalDelivery?: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerType?: 'DRIVER' | 'COMPANY';
  customerId: number | null;
  customer?: Customer;
  totalAmount: number;
  totalDelivery?: number;
  status: OrderStatus;
  driverId: number | null;
  assignedDriver?: Driver | null;
  items?: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: number;
}

export interface Purchase {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  totalAmount: number;
  items?: PurchaseItem[];
  createdAt: Date;
}

export interface Payment {
  id: number;
  customerId: number;
  customer?: Customer;
  amount: number;
  method: PaymentMethod;
  senderName: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface SupplierPayment {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  amount: number;
  method: PaymentMethod;
  senderName: string | null;
  note: string | null;
  createdAt: Date;
}

export interface SupplierLedger {
  id: number;
  supplierId: number;
  type: SupplierLedgerType;
  amount: number;
  referenceId: number | null;
  createdAt: Date;
}
