// backend/app/Http/Resources/Account/AddressResource

export type Address = {
  id: number;
  recipient_name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2: string | null;
  phone: string;
  is_default: boolean;
};

export type NewAddressInput = {
  recipient_name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2?: string | null;
  phone: string;
};

export type OrderLineInput = { variant_id: number; quantity: number };

// backend/app/Http/Requests/Order/StoreOrderRequest（POST /api/orders）。
// address_idか新規addressのどちらか必須
export type CreateOrderRequest =
  | { items: OrderLineInput[]; address_id: number; save_address?: undefined }
  | { items: OrderLineInput[]; address: NewAddressInput; save_address: boolean };

// backend/app/Http/Resources/Order/OrderItemResource

export type OrderItemDetail = {
  id: number;
  product_name: string;
  product_slug: string | null;
  size: string;
  color: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

// backend/app/Http/Resources/Order/OrderResource

export type OrderDetail = {
  order_number: string;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  subtotal: number;
  shipping_fee: number;
  total: number;
  placed_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  cancelled_at: string | null;
  shipping_address: {
    recipient_name: string;
    postal_code: string;
    prefecture: string;
    city: string;
    address_line1: string;
    address_line2: string | null;
    phone: string;
  };
  items: OrderItemDetail[];
};
