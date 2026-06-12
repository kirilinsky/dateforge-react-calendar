import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { buildConfig, D } from "../__tests__/v3/fixtures/builders";
import { CalendarDays } from "../modules-v3/days/CalendarDays";
import { CalendarLunar } from "../modules-v3/lunar/CalendarLunar";
import {
  CalendarToolbar,
  CalendarToolbarGroup,
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarYearTrigger,
} from "../modules-v3/toolbar/CalendarToolbar";
import { Calendar } from "../react-v3/calendar";
import { createTheme } from "./theme-tokens";

const FAMILIES = [
  "noir",
  "espresso",
  "meadow",
  "fjord",
  "velvet",
  "crimson",
  "solar",
  "nebula",
  "neon",
  "prism",
  "slate",
  "pearl",
  "sandstone",
  "bauhaus",
  "monsoon",
  "industrial",
  "snow",
  "eclipse",
  "chalk",
  "temporal",
  "riso",
  "cyber",
  "split",
  "aurora",
  "graphite",
  "dracula",
  "mint",
  "abyss",
];

const meta: Meta = {
  title: "v3/Theme Gallery",
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj;

function Sample({
  theme,
  scheme,
}: {
  theme: string | ReturnType<typeof createTheme>;
  scheme: "light" | "dark" | "auto";
}) {
  return (
    <Calendar
      config={buildConfig({ mode: "range" })}
      initialView={D(2026, 6, 1)}
      theme={theme}
      scheme={scheme}
    >
      <CalendarToolbar>
        <CalendarToolbarGroup>
          <CalendarToolbarMonthTrigger />
          <CalendarToolbarYearTrigger />
        </CalendarToolbarGroup>
        <CalendarToolbarGroup>
          <CalendarToolbarPrev />
          <CalendarToolbarNext />
        </CalendarToolbarGroup>
      </CalendarToolbar>
      <CalendarDays />
    </Calendar>
  );
}

/** One card per family — eyeball the whole set per scheme. */
export const AllFamilies: Story = {
  render: () => {
    const [scheme, setScheme] = useState<"light" | "dark">("light");
    return (
      <div>
        <button
          type="button"
          onClick={() => setScheme(scheme === "light" ? "dark" : "light")}
        >
          scheme: {scheme}
        </button>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 12,
          }}
        >
          {FAMILIES.map((name) => (
            <figure key={name} style={{ margin: 0 }}>
              <figcaption style={{ fontFamily: "monospace", marginBottom: 4 }}>
                {name}
              </figcaption>
              <Sample theme={name} scheme={scheme} />
            </figure>
          ))}
        </div>
      </div>
    );
  },
};

/** Theme + scheme switcher on a single calendar — crossfade animation check:
 *  tokens are typed <color> properties, so switching theme or scheme must
 *  smoothly repaint, never snap. */
export const SwitcherCrossfade: Story = {
  render: () => {
    const [theme, setTheme] = useState("noir");
    const [scheme, setScheme] = useState<"light" | "dark" | "auto">("auto");
    return (
      <div style={{ maxWidth: 360 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select
            aria-label="Theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            {FAMILIES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <select
            aria-label="Scheme"
            value={scheme}
            onChange={(e) =>
              setScheme(e.target.value as "light" | "dark" | "auto")
            }
          >
            <option>auto</option>
            <option>light</option>
            <option>dark</option>
          </select>
        </div>
        <Sample theme={theme} scheme={scheme} />
      </div>
    );
  },
};

const teal = createTheme({
  accent: "#14b8a6",
  range: "#0ea5e9",
  weekend: "#be123c",
  light: { backdrop: "#f0fdff" },
  dark: { backdrop: "#061a1d", text: "#e6fffb" },
});

/** createTheme token object: applied as inline light-dark() vars, follows the
 *  same color-scheme mechanism as built-ins (flip the scheme to verify). */
export const CustomCreateTheme: Story = {
  render: () => {
    const [scheme, setScheme] = useState<"light" | "dark">("light");
    return (
      <div style={{ maxWidth: 360 }}>
        <button
          type="button"
          onClick={() => setScheme(scheme === "light" ? "dark" : "light")}
        >
          scheme: {scheme}
        </button>
        <div style={{ marginTop: 12 }}>
          <Sample theme={teal} scheme={scheme} />
        </div>
      </div>
    );
  },
};

/** Lunar strip under each scheme — verifies module tokens follow the family. */
export const WithLunar: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, maxWidth: 420 }}>
      {(["light", "dark"] as const).map((scheme) => (
        <Calendar
          key={scheme}
          config={buildConfig({ mode: "single" })}
          initialView={D(2026, 6, 1)}
          theme="velvet"
          scheme={scheme}
        >
          <CalendarDays />
          <CalendarLunar />
        </Calendar>
      ))}
    </div>
  ),
};
