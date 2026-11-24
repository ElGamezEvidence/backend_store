import type {
  OrderStatus,
  ProductStatus,
  Role,
  ShippingType,
} from "@prisma/client";

export type Locale = "fr" | "ar" | "en";

export type CartItemInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export type CheckoutPayload = {
  fullName: string;
  phone: string;
  phoneSecondary?: string;
  region?: string;
  city: string;
  addressLine: string;
  postalCode?: string;
  notes?: string;
  shippingType: ShippingType;
  items: CartItemInput[];
  idempotencyKey: string;
  couponCode?: string;
};

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type OrderListFilters = {
  status?: OrderStatus | OrderStatus[];
  query?: string;
  city?: string;
  phone?: string;
  sku?: string;
  productId?: string;
  from?: Date;
  to?: Date;
  pendingTajir?: boolean;
  page?: number;
  pageSize?: number;
};

export type ProductListFilters = {
  status?: ProductStatus | ProductStatus[];
  query?: string;
  categorySlug?: string;
  featured?: boolean;
  popular?: boolean;
  onSale?: boolean;
  page?: number;
  pageSize?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "popular";
};

export type DashboardRange =
  | "today"
  | "7d"
  | "30d"
  | "month"
  | "custom";
