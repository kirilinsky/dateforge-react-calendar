const I = (d: string) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d={d} />
  </svg>
);
export const Down = () => I("M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z");
export const Home = () => I("M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z");
export const Clear = () =>
  I(
    "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  );
export const ThemeToggle = () =>
  I(
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.41 0 8 3.59 8 8s-3.59 8-8 8z",
  );
export const Check = () =>
  I("M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z");
