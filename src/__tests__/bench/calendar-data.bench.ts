import { bench, describe } from "vitest";
import { getCalendarData, getWeekdaysNames } from "@/utils/calendar-data";
import { createDisabled } from "@/utils/create-disabled";

const YEAR = 2024;
const MONTH = 0;
const OFFSET = 0;
const NO_DATES: Date[] = [];

const disabled = createDisabled({ weekends: true });

describe("getCalendarData", () => {
  bench("single mode — no disabled", () => {
    getCalendarData(YEAR, MONTH, OFFSET, NO_DATES);
  });

  bench("single mode — weekends disabled", () => {
    getCalendarData(YEAR, MONTH, OFFSET, NO_DATES, null, null, disabled);
  });

  bench("range mode — with hover", () => {
    getCalendarData(YEAR, MONTH, OFFSET, NO_DATES, null, null, undefined, {
      rangeStart: new Date(2024, 0, 5),
      hoverDate: new Date(2024, 0, 20),
    });
  });

  bench("range mode — committed range", () => {
    getCalendarData(YEAR, MONTH, OFFSET, NO_DATES, null, null, undefined, {
      rangeStart: new Date(2024, 0, 5),
      rangeEnd: new Date(2024, 0, 20),
    });
  });
});

describe("getWeekdaysNames", () => {
  bench("en — short — cold (no cache)", () => {
    getWeekdaysNames("en", 1);
  });
});
