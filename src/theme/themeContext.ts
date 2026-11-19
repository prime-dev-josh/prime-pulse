import { createContext } from "react";
import { PRIME_LIGHT, type PrimeTheme } from "#/theme/primeThemes";

export type ThemeContextValue = {
	theme: PrimeTheme;
	setTheme: (theme: PrimeTheme) => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
	theme: PRIME_LIGHT,
	setTheme: () => {},
});
