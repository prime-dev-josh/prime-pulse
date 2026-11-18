import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import {
	THEME_STORAGE_KEY,
	applyTheme,
	themeFromDocument,
	type Theme,
} from "#/lib/theme";

const ThemeContext = createContext<{
	theme: Theme;
	toggleTheme: () => void;
}>({
	theme: "light",
	toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>(() =>
		typeof document === "undefined" ? "light" : themeFromDocument(),
	);

	const toggleTheme = useCallback(() => {
		setTheme((current) => {
			const next = current === "dark" ? "light" : "dark";
			applyTheme(next);
			try {
				localStorage.setItem(THEME_STORAGE_KEY, next);
			} catch {
				// Ignore private-mode storage failures.
			}
			return next;
		});
	}, []);

	const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
