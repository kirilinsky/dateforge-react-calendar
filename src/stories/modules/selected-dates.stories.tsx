import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarSelectedDates } from "@/modules/selected-dates";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";

type SelectedDatesArgs = {
  allowClear?: boolean;
  allowNavigate?: boolean;
  animated?: boolean;
  align?: "left" | "center" | "right";
  showTime?: boolean;
};

const meta: Meta<SelectedDatesArgs> = {
  title: "Modules/SelectedDates",
  argTypes: {
    allowClear: { control: "boolean" },
    allowNavigate: { control: "boolean" },
    animated: { control: "boolean" },
    align: { control: "inline-radio", options: ["left", "center", "right"] },
    showTime: { control: "boolean" },
  },
  args: {
    allowClear: true,
    allowNavigate: true,
    animated: true,
    align: "left",
    showTime: false,
  },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarSelectedDates
          allowClear={args.allowClear}
          allowNavigate={args.allowNavigate}
          animated={args.animated}
          align={args.align}
          showTime={args.showTime}
        />
      </Calendar>
    );
  },
};

export default meta;

type Story = StoryObj<SelectedDatesArgs>;

export const Default: Story = {};

export const NoClear: Story = {
  args: { allowClear: false },
};
NoClear.storyName = "No clear";

export const NoNavigate: Story = {
  args: { allowNavigate: false },
};
NoNavigate.storyName = "No navigate";

export const WithTime: Story = {
  args: { showTime: true },
};
WithTime.storyName = "With time";

export const AnimatedOff: Story = {
  args: { animated: false },
};
AnimatedOff.storyName = "Animated off";

export const AlignCenter: Story = {
  args: { align: "center" },
};
AlignCenter.storyName = "Aligned center";
