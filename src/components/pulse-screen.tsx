import { useQuery } from "@tanstack/react-query";
import { Button, Card, makeStyles, tokens } from "@fluentui/react-components";
import { Link } from "@tanstack/react-router";
import { AppShell } from "#/components/app-shell";
import { formatDate, formatSendAt } from "#/lib/dates";
import { pulseStats } from "#/lib/pulse";
import { TEMPLATE_KIND_COPY } from "#/lib/types";
import { useOnPageStyles } from "#/theme/onPage";
import { getUpcoming } from "#/server/functions";

const useStyles = makeStyles({
	page: {
		display: "flex",
		flex: 1,
		flexDirection: "column",
		gap: "16px",
		minHeight: 0,
		overflow: "auto",
	},
	stats: {
		display: "grid",
		gap: "12px",
		gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
	},
	stat: {
		padding: "16px",
	},
	label: {
		margin: 0,
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightSemibold,
		letterSpacing: "0.04em",
		textTransform: "uppercase",
		color: tokens.colorBrandForeground1,
	},
	value: {
		margin: "8px 0 0",
		fontSize: tokens.fontSizeHero800,
		fontWeight: tokens.fontWeightSemibold,
	},
	hint: {
		margin: "4px 0 0",
		color: tokens.colorNeutralForeground3,
		fontSize: tokens.fontSizeBase200,
	},
	section: {
		padding: 0,
		overflow: "hidden",
	},
	sectionHead: {
		padding: "16px 20px",
		borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	title: {
		margin: 0,
		fontSize: tokens.fontSizeBase500,
		fontWeight: tokens.fontWeightSemibold,
	},
	row: {
		display: "flex",
		flexWrap: "wrap",
		justifyContent: "space-between",
		gap: "8px",
		padding: "12px 20px",
		color: tokens.colorNeutralForeground1,
		textDecoration: "none",
		borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
		":hover": {
			backgroundColor: tokens.colorNeutralBackground1Hover,
		},
	},
	kind: {
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorBrandForeground1,
	},
	body: {
		padding: "16px 20px",
	},
});

export function PulseScreen() {
	const styles = useStyles();
	const onPage = useOnPageStyles();
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
			<div className={styles.page}>
				{upcoming.isPending ? (
					<p className={onPage.muted}>Checking templates and ADP…</p>
				) : null}
				{upcoming.isError ? (
					<Card>
						<p role="alert">
							{upcoming.error instanceof Error
								? upcoming.error.message
								: "Could not load Pulse"}
						</p>
						<Button appearance="secondary" onClick={() => upcoming.refetch()}>
							Try again
						</Button>
					</Card>
				) : null}
				{board && stats ? (
					<>
						<section className={styles.stats}>
							<Stat label="Next 7 days" value={String(stats.nextSevenDays)} hint="notes" />
							<Stat label="Rest of this month" value={String(stats.restOfMonth)} hint="notes" />
							<Stat label="Birthdays" value={String(stats.birthdays)} hint="people" />
							<Stat label="Anniversaries" value={String(stats.anniversaries)} hint="people" />
							<Card className={styles.stat}>
								<Link to="/templates" style={{ color: "inherit", textDecoration: "none" }}>
									<p className={styles.label}>Templates on</p>
									<p className={styles.value}>{board.templatesOn}</p>
									<p className={styles.hint}>Open templates</p>
								</Link>
							</Card>
						</section>
						<Card className={styles.section}>
							<div className={styles.sectionHead}>
								<h2 className={styles.title}>Next up</h2>
								<p className={styles.hint}>
									The next three notes from templates that are turned on.
								</p>
							</div>
							{stats.next.length === 0 ? (
								<p className={styles.body}>
									No upcoming notes. Create and turn on a template first.
								</p>
							) : (
								<ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
									{stats.next.map((send) => (
										<li key={send.id}>
											<Link
												to="/upcoming"
												search={{ date: send.sendDate }}
												className={styles.row}
											>
												<span>
													<strong>{formatDate(send.sendDate)}</strong>
													<span className={styles.hint}>
														{" "}
														at {formatSendAt(send.sendAt)} ET
													</span>
													<span style={{ display: "block" }}>
														{send.recipientName} · {send.templateName}
													</span>
												</span>
												<span className={styles.kind}>
													{TEMPLATE_KIND_COPY[send.kind].label}
												</span>
											</Link>
										</li>
									))}
								</ul>
							)}
						</Card>
						<Card className={styles.section}>
							<div className={styles.sectionHead}>
								<h2 className={styles.title}>Data readiness</h2>
								<p className={styles.hint}>
									Gaps that would drop someone from a note or send it nowhere.
								</p>
							</div>
							{board.readiness.length === 0 ? (
								<p className={styles.body}>
									ADP has an email, a manager, and milestone dates for the notes
									in this window.
								</p>
							) : (
								<ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
									{board.readiness.map((group) => (
										<li key={group.id} className={styles.body}>
											<div style={{ display: "flex", justifyContent: "space-between" }}>
												<strong>{group.title}</strong>
												<strong>{group.count}</strong>
											</div>
											<p className={styles.hint}>{group.detail}</p>
											<p>
												{group.names.join(", ")}
												{group.count > group.names.length
													? `, and ${group.count - group.names.length} more`
													: ""}
											</p>
										</li>
									))}
								</ul>
							)}
						</Card>
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
	const styles = useStyles();
	return (
		<Card className={styles.stat}>
			<p className={styles.label}>{label}</p>
			<p className={styles.value}>{value}</p>
			<p className={styles.hint}>{hint}</p>
		</Card>
	);
}
