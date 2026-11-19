import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "#/components/theme-provider";

export function Toaster({ ...props }: ToasterProps) {
	const { theme } = useTheme();
	return (
		<Sonner
			theme={theme}
			className="toaster group"
			position="bottom-center"
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:bg-card group-[.toaster]:text-[var(--brand-ink)] group-[.toaster]:border-[var(--line)] group-[.toaster]:shadow-lg",
					description: "group-[.toast]:text-[var(--sea-ink-soft)]",
					actionButton:
						"group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
					cancelButton:
						"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
					error:
						"group-[.toaster]:bg-card group-[.toaster]:text-destructive group-[.toaster]:border-destructive/30",
				},
			}}
			{...props}
		/>
	);
}