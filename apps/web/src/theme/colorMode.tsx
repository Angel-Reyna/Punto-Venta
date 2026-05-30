import { createContext, useContext } from "react";

import type { AppColorMode } from "./theme";

export type ColorModeContextValue = {
  mode: AppColorMode;
  setMode: (mode: AppColorMode) => void;
  toggleMode: () => void;
};

const noop = () => undefined;

export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: "light",
  setMode: noop,
  toggleMode: noop
});

export function useColorMode() {
  return useContext(ColorModeContext);
}
