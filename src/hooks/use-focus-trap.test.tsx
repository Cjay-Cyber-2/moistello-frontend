import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFocusTrap } from "./use-focus-trap";

afterEach(cleanup);

function FocusTrapHarness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => {
    onClose();
    setIsOpen(false);
  };
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen, close);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open menu</button>
      {isOpen && (
        <div ref={trapRef} role="dialog" tabIndex={-1}>
          <button>First menu item</button>
          <a href="/second">Last menu item</a>
        </div>
      )}
      <button>Behind overlay</button>
    </>
  );
}

describe("useFocusTrap", () => {
  it("cycles Tab and Shift+Tab within the open menu", async () => {
    const user = userEvent.setup();
    render(<FocusTrapHarness />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const firstItem = screen.getByRole("button", { name: "First menu item" });
    const lastItem = screen.getByRole("link", { name: "Last menu item" });

    expect(document.activeElement).toBe(firstItem);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(lastItem);
    await user.tab();
    expect(document.activeElement).toBe(firstItem);
  });

  it("closes the menu on Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<FocusTrapHarness onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("returns focus to the trigger when the menu closes", async () => {
    const user = userEvent.setup();
    render(<FocusTrapHarness />);
    const trigger = screen.getByRole("button", { name: "Open menu" });

    await user.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.activeElement).toBe(trigger);
  });
});
