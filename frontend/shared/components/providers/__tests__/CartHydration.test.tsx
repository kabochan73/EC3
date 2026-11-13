import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

import { useCartStore } from "@/features/public/cart/stores/cart";
import { CartHydration } from "../CartHydration";

describe("CartHydration", () => {
  it("マウント時にカートストアを復元する", () => {
    const rehydrate = vi.spyOn(useCartStore.persist, "rehydrate");

    render(<CartHydration />);

    expect(rehydrate).toHaveBeenCalledTimes(1);
  });

  it("何も描画しない", () => {
    const { container } = render(<CartHydration />);

    expect(container).toBeEmptyDOMElement();
  });
});
