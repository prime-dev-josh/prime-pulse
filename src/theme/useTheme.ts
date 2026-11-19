import { useContext } from "react";
import { ThemeContext } from "#/theme/themeContext";

export function useTheme() {
	return useContext(ThemeContext);
}
