// backend/app/Http/Resources/Order/OrderListResource

export type OrderListItem = {
  order_number: string;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  total: number;
  item_count: number;
  placed_at: string | null;
};

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
