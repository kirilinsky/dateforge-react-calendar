type ViewTransition = {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void) => ViewTransition;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function runViewTransition(enabled: boolean, update: () => void) {
  if (!enabled || typeof document === "undefined" || prefersReducedMotion()) {
    update();
    return;
  }

  const startViewTransition = (document as DocumentWithViewTransition)
    .startViewTransition;

  if (!startViewTransition) {
    update();
    return;
  }

  startViewTransition.call(document, update);
}
