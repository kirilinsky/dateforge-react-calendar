import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarInfo } from "@/modules/info";
import { CalendarManualInput } from "@/modules/manual-input";
import { CalendarNav } from "@/modules/nav";
import { CalendarSelectedDates } from "@/modules/selected-dates";

const D = (y: number, m: number, d: number) => new Date(y, m, d);

describe("action aria labels", () => {
  it("uses global Calendar labels across modules", () => {
    const { getAllByLabelText } = render(
      <Calendar
        mode="single"
        value={D(2024, 5, 15)}
        clearLabel="Очистить"
        homeLabel="Текущий месяц"
      >
        <CalendarNav home clear />
        <CalendarInfo showHome allowClear />
        <CalendarSelectedDates allowClear />
        <CalendarManualInput />
      </Calendar>,
    );

    expect(getAllByLabelText("Текущий месяц")).toHaveLength(2);
    expect(getAllByLabelText("Очистить")).toHaveLength(4);
  });

  it("lets module labels override global Calendar labels", () => {
    const { getByLabelText, queryByLabelText } = render(
      <Calendar
        mode="single"
        value={D(2024, 5, 15)}
        clearLabel="Global clear"
        homeLabel="Global home"
      >
        <CalendarNav home clear clearLabel="Nav clear" homeLabel="Nav home" />
        <CalendarInfo
          showHome
          allowClear
          clearLabel="Info clear"
          homeLabel="Info home"
        />
      </Calendar>,
    );

    expect(getByLabelText("Nav clear")).toBeTruthy();
    expect(getByLabelText("Nav home")).toBeTruthy();
    expect(getByLabelText("Info clear")).toBeTruthy();
    expect(getByLabelText("Info home")).toBeTruthy();
    expect(queryByLabelText("Global clear")).toBeNull();
    expect(queryByLabelText("Global home")).toBeNull();
  });
});
