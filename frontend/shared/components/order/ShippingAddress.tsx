type Props = {
  address: {
    recipient_name: string;
    postal_code: string;
    prefecture: string;
    city: string;
    address_line1: string;
    address_line2: string | null;
    phone: string;
  };
};

/** 配送先住所の読み取り専用表示。チェックアウト・注文詳細・マイページなど複数箇所から使う。 */
export function ShippingAddress({ address }: Props) {
  return (
    <div className="text-sm">
      <p>{address.recipient_name}</p>
      <p className="text-graphite">
        〒{address.postal_code} {address.prefecture}
        {address.city}
        {address.address_line1}
        {address.address_line2 ? ` ${address.address_line2}` : ""}
      </p>
      <p className="text-graphite">{address.phone}</p>
    </div>
  );
}
