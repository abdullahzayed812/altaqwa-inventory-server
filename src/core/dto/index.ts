import { PaymentMethod } from '../entities';

export interface CreateCustomerDto {
  name: string;
  phone?: string;
  address?: string;
}

export interface CreateSupplierDto {
  name: string;
  phone?: string;
  address?: string;
}

export interface CreateProductDto {
  name: string;
  price: number;
  stock: number;
  imagePath?: string;
}

export interface CreateDriverDto {
  name: string;
  phone?: string;
  vehiclePlate?: string;
  vehicleDetails?: string;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  stock?: number;
  imagePath?: string;
}

export interface OrderItemDto {
  productId: number;
  quantity: number;
  price: number;
  deliveryFeePerTon?: number;
  totalDelivery?: number;
}

export interface CreateOrderDto {
  customerType?: 'DRIVER' | 'COMPANY';
  customerId?: number | null;
  driverId?: number | null;
  totalAmount: number;
  totalDelivery?: number;
  items: OrderItemDto[];
}

export interface PurchaseItemDto {
  productId: number;
  quantity: number;
  price: number;
}

export interface CreatePurchaseDto {
  supplierId: number;
  items: PurchaseItemDto[];
}

export interface AddPaymentDto {
  customerId: number;
  amount: number;
  method: PaymentMethod;
  senderName?: string;
  notes?: string;
}

export interface AddSupplierPaymentDto {
  supplierId: number;
  amount: number;
  method: PaymentMethod;
  senderName?: string;
  note?: string;
}
