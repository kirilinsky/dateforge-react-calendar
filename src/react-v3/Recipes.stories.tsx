import type { Meta, StoryObj } from "@storybook/react-vite";
import { buildConfig, D } from "../__tests__/v3/fixtures/builders";
import { storyLocale, storyThemeProps } from "../modules-v3/_lab/story-globals";
import { CalendarDays } from "../modules-v3/days/CalendarDays";
import { Calendar } from "./calendar";
import { useCalendarActions, useCalendarStore } from "./provider";
import { UIButton } from "./ui/button";
import { useStoreSelector } from "./use-store-selector";

/**
 * Custom-module recipe (RC-gate item): everything a third-party module needs is
 * the `/context` surface — `useCalendarStore` + `useStoreSelector` to READ
 * (narrow, selector-based subscriptions), `useCalendarActions` to WRITE. No
 * internal imports, no context spelunking. This story builds one from scratch.
 */
const meta: Meta = {
  title: "v3/Recipes",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

/**
 * A custom footer module: shows how many days are picked and jumps the view to
 * the earliest one. Reads via a selector (re-renders only when the count or
 * first date changes), writes via `navigateTo`.
 */
function SelectionSummary() {
  const store = useCalendarStore();
  const { navigateTo, clear } = useCalendarActions();
  const first = useStoreSelector(store, (s) =>
    s.selection.shape === "point" ? s.selection.dates[0]?.date : undefined,
  );
  const count = useStoreSelector(store, (s) =>
    s.selection.shape === "point" ? s.selection.dates.length : 0,
  );
  if (count === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontSize: 13 }}>
        {count} day{count > 1 ? "s" : ""} picked
      </span>
      <span style={{ display: "flex", gap: 4 }}>
        <UIButton size="sm" onClick={() => first && navigateTo(first)}>
          Jump to first
        </UIButton>
        <UIButton variant="ghost" size="sm" onClick={() => clear()}>
          Reset
        </UIButton>
      </span>
    </div>
  );
}

export const CustomModule: Story = {
  render: (_, ctx) => (
    <div style={{ width: 320 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "multiple" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
        <SelectionSummary />
      </Calendar>
    </div>
  ),
};
