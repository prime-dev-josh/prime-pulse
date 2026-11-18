import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AppShell } from "#/components/app-shell";
import { Button } from "#/components/ui/button";
import { formatDate, formatSendAt } from "#/lib/dates";
import { pulseStats } from "#/lib/pulse";
import { TEMPLATE_KIND_COPY } from "#/lib/types";
import { getUpcoming } from "#/server/functions";

export function PulseScreen() {
	const upcoming = useQuery({
		queryKey: ["upcoming"],
		queryFn: () => getUpcoming(),
		retry: false,
	});
	const board = upcoming.data;
	const stats = board ? pulseStats(board.sends, board.today) : null;

	return (
		<AppShell
			heading="Pulse"
			title="What would go out next, and whether ADP has what those notes need. Nothing is sent from this screen."
		>
			<div className="min-h-0 flex-1 space-y-4 overflow-auto">
				{upcoming.isPending ? (
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Checking templates and ADP…
					</p>
				) : null}
				{upcoming.isError ? (
					<div className="space-y-3 rounded-xl border border-[var(--line)] bg-card p-6">
						<p className="text-sm text-destructive" role="alert">
							{upcoming.error instanceof Error
								? upcoming.error.message
								: "Could not load Pulse"}
						</p>
						<Button variant="outline" onClick={() => upcoming.refetch()}>
							Try again
						</Button>
					</div>
				) : null}
				{board && stats ? (
					<>
						<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
							<Stat
								label="Next 7 days"
								value={String(stats.nextSevenDays)}
								hint="notes"
							/>
							<Stat
								label="Rest of this month"
								value={String(stats.restOfMonth)}
								hint="notes"
							/>
							<Stat
								label="Birthdays"
								value={String(stats.birthdays)}
								hint="people"
							/>
							<Stat
								label="Anniversaries"
								value={String(stats.anniversaries)}
								hint="people"
							/>
							<Link
								to="/templates"
								className="rounded-xl border border-[var(--line)] bg-card p-4 text-[var(--brand-ink)] no-underline shadow-sm hover:border-[var(--brand-orange)]"
							>
								<p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-indigo-light)] dark:text-[var(--brand-orange)]">
									Templates on
								</p>
								<p className="mt-2 text-3xl font-semibold tabular-nums">
									{board.templatesOn}
								</p>
								<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
									Open templates
								</p>
							</Link>
						</section>
						<section className="rounded-xl border border-[var(--line)] bg-card shadow-sm">
							<div className="border-b border-[var(--line)] px-5 py-4">
								<h2 className="text-lg font-semibold text-[var(--brand-ink)]">
									Next up
								</h2>
								<p className="mt-0.5 text-sm text-[var(--sea-ink-soft)]">
									The next three notes from templates that are turned on.
								</p>
							</div>
							{stats.next.length === 0 ? (
								<p className="px-5 py-6 text-sm text-[var(--sea-ink-soft)]">
									No upcoming notes. Create and turn on a template first.
								</p>
							) : (
								<ul>
									{stats.next.map((send) => (
										<li
											key={send.id}
											className="border-t border-[var(--line)] first:border-t-0"
										>
											<Link
												to="/upcoming"
												search={{ date: send.sendDate }}
												className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3 text-[var(--brand-ink)] no-underline hover:bg-[var(--brand-tint-25)] dark:!text-white"
											>
												<span>
													<span className="font-semibold">
														{formatDate(send.sendDate)}
													</span>
													<span className="text-[var(--sea-ink-soft)] dark:text-white">
														{" "}
														at {formatSendAt(send.sendAt)} ET
													</span>
													<span className="mt-0.5 block text-sm">
														{send.recipientName} · {send.templateName}
													</span>
												</span>
												<span className="text-xs font-semibold text-[var(--brand-indigo)] dark:text-[var(--brand-orange)]">
													{TEMPLATE_KIND_COPY[send.kind].label}
												</span>
											</Link>
										</li>
									))}
								</ul>
							)}
						</section>
						<section className="rounded-xl border border-[var(--line)] bg-card shadow-sm">
							<div className="border-b border-[var(--line)] px-5 py-4">
								<h2 className="text-lg font-semibold text-[var(--brand-ink)]">
									Data readiness
								</h2>
								<p className="mt-0.5 text-sm text-[var(--sea-ink-soft)]">
									Gaps that would drop someone from a note or send it nowhere.
								</p>
							</div>
							{board.readiness.length === 0 ? (
								<p className="px-5 py-6 text-sm text-[var(--sea-ink-soft)]">
									ADP has an email, a manager, and milestone dates for the notes
									in this window.
								</p>
							) : (
								<ul className="divide-y divide-[var(--line)]">
									{board.readiness.map((group) => (
										<li key={group.id} className="px-5 py-4">
											<div className="flex items-baseline justify-between gap-3">
												<p className="font-semibold text-[var(--brand-ink)]">
													{group.title}
												</p>
												<p className="text-sm font-semibold tabular-nums text-[var(--brand-orange-dark)]">
													{group.count}
												</p>
											</div>
											<p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
												{group.detail}
											</p>
											<p className="mt-2 text-sm">
												{group.names.join(", ")}
												{group.count > group.names.length
													? `, and ${group.count - group.names.length} more`
													: ""}
											</p>
										</li>
									))}
								</ul>
							)}
						</section>
					</>
				) : null}
			</div>
		</AppShell>
	);
}

function Stat({
	label,
	value,
	hint,
}: {
	label: string;
	value: string;
	hint: string;
}) {
	return (
		<div className="rounded-xl border border-[var(--line)] bg-card p-4 shadow-sm">
			<p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-indigo-light)] dark:text-[var(--brand-orange)]">
				{label}
			</p>
			<p className="mt-2 text-3xl font-semibold tabular-nums text-[var(--brand-ink)]">
				{value}
			</p>
			<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">{hint}</p>
		</div>
	);
}
