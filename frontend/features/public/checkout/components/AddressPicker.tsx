import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Field } from "@/shared/components/ui/Field";
import { ShippingAddress } from "@/shared/components/ui/ShippingAddress";

import type { NewAddressFormValues } from "./CheckoutClient.schema";
import type { Address } from "../types";

type Props = {
  addresses: Address[];
  /** 既存の住所を選択中ならそのid。新規入力中はnull */
  selectedId: number | null;
  onSelectExisting: (id: number) => void;
  useNew: boolean;
  onUseNew: () => void;
  /** 新規入力フォーム（useNewのとき表示） */
  register: UseFormRegister<NewAddressFormValues>;
  errors: FieldErrors<NewAddressFormValues>;
  saveAddress: boolean;
  onSaveAddressChange: (value: boolean) => void;
};

/**
 * 配送先の選択（住所録から選ぶ/新しい住所を入力）。状態はCheckoutClientが持ち、ここは表示だけ。
 */
export function AddressPicker({
  addresses,
  selectedId,
  onSelectExisting,
  useNew,
  onUseNew,
  register,
  errors,
  saveAddress,
  onSaveAddressChange,
}: Props) {
  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <label
          key={address.id}
          className={`flex cursor-pointer gap-3 border p-4 ${
            !useNew && selectedId === address.id ? "border-ink" : "border-mist"
          }`}
        >
          <input
            type="radio"
            name="address-choice"
            className="mt-1 accent-ink"
            checked={!useNew && selectedId === address.id}
            onChange={() => onSelectExisting(address.id)}
          />
          <span>
            {address.is_default && (
              <span className="mb-1 inline-block border border-graphite px-1 text-[9px] tracking-widest text-graphite uppercase">
                Default
              </span>
            )}
            <ShippingAddress address={address} />
          </span>
        </label>
      ))}

      <label
        className={`flex cursor-pointer gap-3 border p-4 text-sm ${useNew ? "border-ink" : "border-mist"}`}
      >
        <input
          type="radio"
          name="address-choice"
          className="mt-1 accent-ink"
          checked={useNew}
          onChange={onUseNew}
        />
        <span className="tracking-widest uppercase">新しい住所を入力</span>
      </label>

      {useNew && (
        <div className="space-y-5 border border-ink p-6">
          <Field
            label="Recipient Name"
            id="recipient_name"
            error={errors.recipient_name?.message}
            {...register("recipient_name")}
          />
          <Field
            label="Postal Code"
            id="postal_code"
            placeholder="123-4567"
            error={errors.postal_code?.message}
            {...register("postal_code")}
          />
          <Field
            label="Prefecture"
            id="prefecture"
            error={errors.prefecture?.message}
            {...register("prefecture")}
          />
          <Field label="City" id="city" error={errors.city?.message} {...register("city")} />
          <Field
            label="Address Line 1"
            id="address_line1"
            error={errors.address_line1?.message}
            {...register("address_line1")}
          />
          <Field
            label="Address Line 2"
            id="address_line2"
            error={errors.address_line2?.message}
            {...register("address_line2")}
          />
          <Field label="Phone" id="phone" error={errors.phone?.message} {...register("phone")} />

          <label className="flex items-center gap-2 text-xs tracking-widest text-graphite uppercase">
            <input
              type="checkbox"
              className="accent-ink"
              checked={saveAddress}
              onChange={(e) => onSaveAddressChange(e.target.checked)}
            />
            この住所を住所録に保存する
          </label>
        </div>
      )}
    </div>
  );
}
