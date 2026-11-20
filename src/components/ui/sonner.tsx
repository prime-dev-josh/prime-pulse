import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "#/theme/useTheme";

export function Toaster({ ...props }: ToasterProps) {
	const { theme } = useTheme();
	return (
		<Sonner
			theme={theme.isDark ? "dark" : "light"}
			className="toaster group"
			position="bottom-center"
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:bg-card group-[.toaster]:text-[var(--brand-ink)] group-[.toaster]:border-[var(--line)] group-[.toaster]:shadow-lg",
					description: "group-[.toast]:text-[var(--sea-ink-soft)]",
					actionButton:
						"group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground",
					cancelButton:
						"group-[.toaster]:bg-muted group-[.toaster]:text-muted-foreground",
					error:
						"group-[.toaster]:bg-card group-[.toaster]:text-destructive group-[.toaster]:border-destructive/30",
				},
			}}
			{...props}
		/>
	);
}
