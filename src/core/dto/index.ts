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

export interface OrderItemDto {
  productId: number;
  quantity: number;
  price: number;
}

export interface CreateOrderDto {
  customerId: number;
  totalAmount: number;
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
  notes?: string;
}

export interface AddSupplierPaymentDto {
  supplierId: number;
  amount: number;
  note?: string;
}
