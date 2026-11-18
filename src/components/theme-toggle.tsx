import { Moon, Sun } from "lucide-react";
import { useTheme } from "#/components/theme-provider";

export function ThemeToggle() {
	const { toggleTheme } = useTheme();
	return (
		<button
			type="button"
			onClick={toggleTheme}
			aria-label="Toggle dark mode"
			className="rounded-md p-2 text-white/90 hover:bg-white/12"
		>
			<Sun className="hidden size-4 dark:block" />
			<Moon className="size-4 dark:hidden" />
		</button>
	);
}
