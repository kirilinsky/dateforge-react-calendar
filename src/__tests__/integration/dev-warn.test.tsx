import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { __resetWarnOnce } from "@/core/dev-warn";

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  __resetWarnOnce();
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

const lastMsg = (): string => warnSpy.mock.calls.at(-1)?.[0] as string;

describe("dev-warn — value shape vs mode", () => {
  it("warns when range mode receives a Date", () => {
    render(
      <Calendar mode="range" value={new Date(2024, 5, 15) as never}>
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain('mode="range"');
  });

  it("warns when single mode receives a DateRange", () => {
    render(
      <Calendar
        value={
          {
            from: new Date(2024, 5, 1),
            to: new Date(2024, 5, 5),
          } as never
        }
      >
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain('mode="single"');
  });

  it("warns when multiple mode receives a Date", () => {
    render(
      <Calendar mode="multiple" value={new Date(2024, 5, 15) as never}>
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain('mode="multiple"');
  });

  it("does not warn when shapes match", () => {
    render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("dev-warn — invalid Date", () => {
  it("warns when value contains an invalid Date", () => {
    render(
      <Calendar value={new Date("totally not a date")}>
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain("invalid Date");
  });
});

describe("dev-warn — minDate vs maxDate", () => {
  it("warns when minDate is later than maxDate", () => {
    render(
      <Calendar
        minDate={new Date(2024, 5, 20)}
        maxDate={new Date(2024, 5, 1)}
      >
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain("minDate");
  });

  it("does not warn for valid minDate <= maxDate", () => {
    render(
      <Calendar
        minDate={new Date(2024, 5, 1)}
        maxDate={new Date(2024, 5, 20)}
      >
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("dev-warn — theme", () => {
  it("warns when an unsupported theme string is passed", () => {
    render(
      <Calendar theme={"midnight" as never}>
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain('"midnight"');
    expect(lastMsg()).toContain("not a supported string");
  });

  it('does not warn for "auto" / "light" / "dark"', () => {
    render(
      <Calendar theme="dark">
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("falls back to system theme on invalid string (data-theme not 'midnight')", () => {
    const { container } = render(
      <Calendar theme={"midnight" as never}>
        <CalendarDays />
      </Calendar>,
    );
    const root = container.querySelector("[data-theme]") as HTMLElement;
    expect(root.getAttribute("data-theme")).not.toBe("midnight");
    expect(["light", "dark"]).toContain(root.getAttribute("data-theme"));
  });
});

describe("dev-warn — timeZone", () => {
  it("warns when an invalid IANA timezone is passed", () => {
    render(
      <Calendar timeZone="Europe/Wrongville">
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain("Europe/Wrongville");
    expect(lastMsg()).toContain("not a valid IANA timezone");
  });

  it('does not warn for "auto"', () => {
    render(
      <Calendar timeZone="auto">
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not warn for valid IANA timezone", () => {
    render(
      <Calendar timeZone="Europe/Paris">
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not warn for UTC offset format", () => {
    render(
      <Calendar timeZone="UTC+2">
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not warn when timeZone prop is omitted (auto-detect)", () => {
    render(
      <Calendar>
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("dev-warn — dedupe", () => {
  it("warns only once for the same condition across renders", () => {
    const { rerender } = render(
      <Calendar mode="range" value={new Date(2024, 5, 15) as never}>
        <CalendarDays />
      </Calendar>,
    );
    rerender(
      <Calendar mode="range" value={new Date(2024, 5, 16) as never}>
        <CalendarDays />
      </Calendar>,
    );
    rerender(
      <Calendar mode="range" value={new Date(2024, 5, 17) as never}>
        <CalendarDays />
      </Calendar>,
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
