import { FluentProvider } from "@fluentui/react-components";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type CSSProperties,
	type ReactNode,
} from "react";
import { revealApp } from "#/theme/PrimeSplash";
import { ThemeContext } from "#/theme/themeContext";
import {
	findTheme,
	PRIME_LIGHT,
	systemDefaultTheme,
	THEME_STORAGE_KEY,
	type PrimeTheme,
} from "#/theme/primeThemes";

/**
 * Paints the PRIME theme catalog. The choice lives in this browser; there is no
 * signed-in profile to roam it to.
 */
export function PrimeThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<PrimeTheme>(PRIME_LIGHT);
	const [hydrated, setHydrated] = useState(false);

	const setTheme = useCallback((next: PrimeTheme) => {
		setThemeState(next);
		try {
			localStorage.setItem(THEME_STORAGE_KEY, next.id);
		} catch {
			// Private mode or quota: the choice still holds for this session.
		}
	}, []);

	useEffect(() => {
		setThemeState(storedTheme() ?? systemTheme());
		setHydrated(true);
		const fallback = window.setTimeout(revealApp, 2000);
		return () => window.clearTimeout(fallback);
	}, []);

	useEffect(() => {
		document.body.dataset.primeTheme = theme.id;
		document.documentElement.dataset.primeTheme = theme.id;
		document.documentElement.classList.toggle("dark", theme.isDark);
		document.documentElement.style.colorScheme = theme.isDark ? "dark" : "light";
		document.body.style.background = theme.shell["--prime-page-bg"];
	}, [theme]);

	useEffect(() => {
		if (!hydrated) return;
		const frame = requestAnimationFrame(() => {
			requestAnimationFrame(revealApp);
		});
		return () => cancelAnimationFrame(frame);
	}, [hydrated]);

	const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

	return (
		<ThemeContext.Provider value={value}>
			<FluentProvider
				theme={theme.theme}
				style={
					{ ...theme.shell, background: "var(--prime-page-bg)" } as CSSProperties
				}
			>
				{children}
			</FluentProvider>
		</ThemeContext.Provider>
	);
}

function storedTheme(): PrimeTheme | undefined {
	try {
		return findTheme(localStorage.getItem(THEME_STORAGE_KEY));
	} catch {
		return undefined;
	}
}

function systemTheme(): PrimeTheme {
	return systemDefaultTheme(
		window.matchMedia("(prefers-color-scheme: dark)").matches,
	);
}
