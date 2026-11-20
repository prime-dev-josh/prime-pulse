import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ThemePicker } from "#/components/theme-picker";

const links = [
	{ to: "/", label: "Pulse", exact: true },
	{ to: "/templates", label: "Templates", exact: true },
	{ to: "/upcoming", label: "Upcoming", exact: false },
] as const;

export function AppShell({
	heading,
	title,
	children,
}: {
	heading: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<div className="flex h-dvh flex-col overflow-hidden bg-[var(--prime-page-bg)] text-[var(--foreground)]">
			<header className="relative z-20 shrink-0 bg-[var(--prime-header-bg)] text-[var(--prime-header-fg)] shadow-[inset_0_-3px_0_#f15d2a]">
				<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
					<div className="flex min-w-0 items-center gap-3.5">
						<img
							src="/prime-ae-logo-white.png"
							alt="PRIME AE"
							className="h-7 w-auto"
						/>
						<span
							aria-hidden="true"
							className="hidden h-5 w-px bg-white/45 sm:block"
						/>
						<p className="text-sm font-bold tracking-wide">Prime Pulse</p>
					</div>
					<div className="flex flex-wrap items-center gap-1">
						<nav
							aria-label="Prime Pulse"
							className="flex flex-wrap items-center gap-1"
						>
							{links.map((link) => (
								<Link
									key={link.to}
									to={link.to}
									activeOptions={{ exact: link.exact }}
									activeProps={{
										className:
											"rounded-md bg-[var(--prime-cta-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--prime-cta-fg)] no-underline",
									}}
									inactiveProps={{
										className:
											"rounded-md px-3 py-1.5 text-sm font-semibold text-white/90 no-underline hover:bg-[var(--prime-header-hover)]",
									}}
								>
									{link.label}
								</Link>
							))}
						</nav>
						<ThemePicker />
					</div>
				</div>
			</header>
			<div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6">
				<div className="mb-6 shrink-0">
					<h1 className="text-2xl font-semibold tracking-tight text-[var(--prime-page-fg)]">
						{heading}
					</h1>
					<p className="mt-1 text-sm text-[var(--prime-page-fg-muted)]">
						{title}
					</p>
				</div>
				<main className="flex min-h-0 flex-1 flex-col overflow-hidden">
					{children}
				</main>
			</div>
		</div>
	);
}
