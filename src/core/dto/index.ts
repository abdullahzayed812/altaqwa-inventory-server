import { PaymentMethod, CustomerType } from '../entities';

export interface CreateCustomerDto {
  name: string;
  phone?: string;
  address?: string;
  type?: CustomerType;
  vehiclePlate?: string;
  vehicleDetails?: string;
  initialDebt?: number;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string | null;
  address?: string | null;
  vehiclePlate?: string | null;
  vehicleDetails?: string | null;
  isAvailable?: boolean;
}

export interface CreateSupplierDto {
  name: string;
  phone?: string;
  address?: string;
  initialBalance?: number;
}

export interface UpdateSupplierDto {
  name?: string;
  phone?: string | null;
  address?: string | null;
}

export interface CreateProductDto {
  name: string;
  price: number;
  stock: number;
  imagePath?: string;
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
  customerId: number;
  totalAmount: number;
  naulonUncollected?: number;
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

export interface UpdatePurchaseDto {
  items: PurchaseItemDto[];
}

export interface AddPaymentDto {
  customerId: number;
  amount: number;
  method: PaymentMethod;
  senderName?: string;
  notes?: string;
}

export interface UpdatePaymentDto {
  amount: number;
  method?: PaymentMethod;
  senderName?: string | null;
  notes?: string | null;
}

export interface AddSupplierPaymentDto {
  supplierId: number;
  amount: number;
  method: PaymentMethod;
  senderName?: string;
  note?: string;
}

export interface UpdateSupplierPaymentDto {
  amount: number;
  method?: PaymentMethod;
  senderName?: string | null;
  note?: string | null;
}
