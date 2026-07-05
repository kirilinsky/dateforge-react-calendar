import { createContext, type ReactNode, useContext, useMemo } from "react";
import {
  type LabelKey,
  type LabelOverrides,
  type LabelParams,
  resolveLabel,
} from "../core/labels";

/**
 * Root-level label overrides, exposed to every module as a resolver. Modules
 * call `useLabels()` and resolve `key → (module override) → root override →
 * English default`, so no module hard-codes an aria string and every label is
 * overridable at the root via `<Calendar labels={...}>`.
 */
export type LabelResolver = (
  key: LabelKey,
  params?: LabelParams,
  /** Module-level override (usually a component's `label` prop). */
  moduleOverride?: string,
) => string;

const LabelsContext = createContext<LabelResolver | null>(null);

export function LabelsProvider({
  labels,
  children,
}: {
  labels?: LabelOverrides;
  children: ReactNode;
}) {
  const resolver = useMemo<LabelResolver>(
    () => (key, params, moduleOverride) =>
      resolveLabel(
        key,
        {
          module: moduleOverride ? { [key]: moduleOverride } : undefined,
          root: labels,
        },
        params,
      ),
    [labels],
  );
  return (
    <LabelsContext.Provider value={resolver}>{children}</LabelsContext.Provider>
  );
}

/**
 * The label resolver for the nearest provider. Falls back to a root-less
 * resolver (English defaults + module overrides) when used outside a provider,
 * so primitives stay usable in isolation/tests without throwing.
 */
export function useLabels(): LabelResolver {
  return (
    useContext(LabelsContext) ??
    ((key, params, moduleOverride) =>
      resolveLabel(
        key,
        { module: moduleOverride ? { [key]: moduleOverride } : undefined },
        params,
      ))
  );
}
