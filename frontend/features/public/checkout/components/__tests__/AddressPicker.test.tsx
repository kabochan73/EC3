import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";

import { AddressPicker } from "../AddressPicker";
import type { NewAddressFormValues } from "../CheckoutClient.schema";
import type { Address } from "../../types";

function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: 1,
    recipient_name: "田中 葵",
    postal_code: "150-0001",
    prefecture: "東京都",
    city: "渋谷区",
    address_line1: "1-2-3",
    address_line2: null,
    phone: "09012345678",
    is_default: false,
    ...overrides,
  };
}

function Harness(props: {
  addresses: Address[];
  selectedId: number | null;
  useNew: boolean;
  onSelectExisting: (id: number) => void;
  onUseNew: () => void;
}) {
  const {
    register,
    formState: { errors },
  } = useForm<NewAddressFormValues>();

  return (
    <AddressPicker
      addresses={props.addresses}
      selectedId={props.selectedId}
      onSelectExisting={props.onSelectExisting}
      useNew={props.useNew}
      onUseNew={props.onUseNew}
      register={register}
      errors={errors}
      saveAddress={true}
      onSaveAddressChange={() => {}}
    />
  );
}

describe("AddressPicker", () => {
  it("既存住所を一覧表示し、defaultバッジを出す", () => {
    render(
      <Harness
        addresses={[makeAddress({ is_default: true })]}
        selectedId={1}
        useNew={false}
        onSelectExisting={() => {}}
        onUseNew={() => {}}
      />,
    );

    expect(screen.getByText("田中 葵")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("既存住所を選ぶとonSelectExistingが呼ばれる", async () => {
    const user = userEvent.setup();
    const onSelectExisting = vi.fn();
    render(
      <Harness
        addresses={[makeAddress({ id: 7 })]}
        selectedId={null}
        useNew={true}
        onSelectExisting={onSelectExisting}
        onUseNew={() => {}}
      />,
    );

    await user.click(screen.getByText("田中 葵").closest("label")!.querySelector("input")!);

    expect(onSelectExisting).toHaveBeenCalledWith(7);
  });

  it("新しい住所を選ぶと入力欄が表示される", () => {
    render(
      <Harness
        addresses={[makeAddress()]}
        selectedId={1}
        useNew={true}
        onSelectExisting={() => {}}
        onUseNew={() => {}}
      />,
    );

    expect(screen.getByLabelText("Recipient Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Postal Code")).toBeInTheDocument();
  });

  it("新規入力欄が無いときは表示しない", () => {
    render(
      <Harness
        addresses={[makeAddress()]}
        selectedId={1}
        useNew={false}
        onSelectExisting={() => {}}
        onUseNew={() => {}}
      />,
    );

    expect(screen.queryByLabelText("Recipient Name")).not.toBeInTheDocument();
  });
});
