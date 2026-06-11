import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { type ReactNode, useRef, useState } from "react";
import { describe, expect, it } from "vitest";
import { CalendarPopup } from "@/react-v3/CalendarPopup";
import { UIProvider, useUI } from "@/react-v3/ui-context";

const uiWrapper = ({ children }: { children: ReactNode }) => (
  <UIProvider>{children}</UIProvider>
);

describe("UIContext", () => {
  it("opens, reports, and closes a popup", () => {
    const { result } = renderHook(() => useUI(), { wrapper: uiWrapper });
    const el = document.createElement("button");

    expect(result.current.popup).toBeNull();
    act(() => result.current.open("month", el));
    expect(result.current.popup).toBe("month");
    expect(result.current.isOpen("month")).toBe(true);
    expect(result.current.anchor).toBe(el);

    act(() => result.current.close());
    expect(result.current.popup).toBeNull();
    expect(result.current.anchor).toBeNull();
  });

  it("toggle flips the same kind and switches between kinds", () => {
    const { result } = renderHook(() => useUI(), { wrapper: uiWrapper });
    const el = document.createElement("button");

    act(() => result.current.toggle("month", el));
    expect(result.current.popup).toBe("month");
    act(() => result.current.toggle("month", el));
    expect(result.current.popup).toBeNull();

    act(() => result.current.toggle("month", el));
    act(() => result.current.toggle("year", el));
    expect(result.current.popup).toBe("year");
  });

  it("throws outside a provider", () => {
    expect(() => renderHook(() => useUI())).toThrow(
      /within a CalendarProvider/,
    );
  });
});

function PopupHarness({ label = "Picker" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button type="button" ref={ref} onClick={() => setOpen(true)}>
        open
      </button>
      <CalendarPopup
        open={open}
        anchor={ref.current}
        onClose={() => setOpen(false)}
        label={label}
      >
        <button type="button">inside</button>
      </CalendarPopup>
    </>
  );
}

describe("CalendarPopup", () => {
  it("renders nothing until opened, then portals a dialog into body", () => {
    const { getByText, queryByRole } = render(<PopupHarness />);
    expect(queryByRole("dialog")).toBeNull();
    fireEvent.click(getByText("open"));
    const dialog = queryByRole("dialog");
    expect(dialog).not.toBeNull();
    // Portalled to document.body, not nested in the trigger's parent.
    expect(dialog?.parentElement).toBe(document.body);
    expect(dialog?.getAttribute("aria-label")).toBe("Picker");
  });

  it("closes on Escape", () => {
    const { getByText, queryByRole } = render(<PopupHarness />);
    fireEvent.click(getByText("open"));
    expect(queryByRole("dialog")).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(queryByRole("dialog")).toBeNull();
  });

  it("closes on outside pointerdown but not inside", () => {
    const { getByText, queryByRole } = render(<PopupHarness />);
    fireEvent.click(getByText("open"));
    // Inside pointer keeps it open.
    fireEvent.pointerDown(getByText("inside"));
    expect(queryByRole("dialog")).not.toBeNull();
    // Outside closes.
    fireEvent.pointerDown(document.body);
    expect(queryByRole("dialog")).toBeNull();
  });

  it("carries theme/scheme defaults for token resolution", () => {
    const { getByText, queryByRole } = render(<PopupHarness />);
    fireEvent.click(getByText("open"));
    const dialog = queryByRole("dialog");
    expect(dialog?.getAttribute("data-theme")).toBe("noir");
    expect(dialog?.getAttribute("data-scheme")).toBe("auto");
  });
});
