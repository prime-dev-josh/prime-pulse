import { makeStyles, tokens } from "@fluentui/react-components";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ThemePicker } from "#/components/theme-picker";
import { useOnPageStyles } from "#/theme/onPage";

const links = [
	{ to: "/", label: "Pulse", exact: true },
	{ to: "/templates", label: "Templates", exact: true },
	{ to: "/upcoming", label: "Upcoming", exact: false },
] as const;

const useStyles = makeStyles({
	shell: {
		display: "flex",
		flexDirection: "column",
		height: "100dvh",
		overflow: "hidden",
		backgroundColor: "var(--prime-page-bg)",
		color: "var(--prime-page-fg)",
	},
	header: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "center",
		justifyContent: "space-between",
		gap: "12px",
		padding: "10px 24px",
		backgroundColor: "var(--prime-header-bg)",
		color: "var(--prime-header-fg)",
		boxShadow: "inset 0 -3px 0 #f15d2a",
	},
	brand: {
		display: "flex",
		alignItems: "center",
		gap: "14px",
		minWidth: 0,
	},
	logo: {
		display: "block",
		height: "32px",
		width: "auto",
	},
	rule: {
		width: "1px",
		alignSelf: "stretch",
		margin: "4px 0",
		backgroundColor: "rgba(255, 255, 255, 0.45)",
	},
	product: {
		margin: 0,
		fontWeight: tokens.fontWeightRegular,
		fontSize: tokens.fontSizeBase400,
		lineHeight: tokens.lineHeightBase400,
		color: "var(--prime-header-fg)",
	},
	actions: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "center",
		gap: "4px",
		"& .fui-Button": {
			color: "var(--prime-header-fg)",
			"--colorNeutralForeground2": "var(--prime-header-fg)",
			"--colorNeutralForeground2Hover": "var(--prime-header-fg)",
			"--colorNeutralForeground2Pressed": "var(--prime-header-fg)",
			"--colorSubtleBackgroundHover": "var(--prime-header-hover)",
			"--colorTransparentBackgroundHover": "var(--prime-header-hover)",
			"--colorSubtleBackgroundPressed": "var(--prime-header-pressed)",
			"--colorTransparentBackgroundPressed": "var(--prime-header-pressed)",
			"--colorStrokeFocus2": "var(--prime-header-fg)",
		},
	},
	nav: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "center",
		gap: "4px",
	},
	navLink: {
		borderRadius: tokens.borderRadiusMedium,
		padding: "6px 12px",
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightSemibold,
		color: "var(--prime-header-fg)",
		textDecoration: "none",
		":hover": {
			backgroundColor: "var(--prime-header-hover)",
		},
	},
	navLinkActive: {
		borderRadius: tokens.borderRadiusMedium,
		padding: "6px 12px",
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightSemibold,
		color: "var(--prime-cta-fg)",
		backgroundColor: "var(--prime-cta-bg)",
		textDecoration: "none",
		":hover": {
			backgroundColor: "var(--prime-cta-bg-hover)",
		},
	},
	body: {
		display: "flex",
		flex: 1,
		flexDirection: "column",
		minHeight: 0,
		width: "100%",
		maxWidth: "72rem",
		margin: "0 auto",
		padding: "24px",
		overflow: "hidden",
	},
	heading: {
		margin: 0,
		fontSize: tokens.fontSizeHero700,
		fontWeight: tokens.fontWeightSemibold,
		color: "var(--prime-page-fg)",
	},
	main: {
		display: "flex",
		flex: 1,
		flexDirection: "column",
		minHeight: 0,
		overflow: "hidden",
	},
});

export function AppShell({
	heading,
	title,
	children,
}: {
	heading: string;
	title: string;
	children: ReactNode;
}) {
	const styles = useStyles();
	const onPage = useOnPageStyles();
	return (
		<div className={styles.shell}>
			<header className={styles.header}>
				<div className={styles.brand}>
					<img
						src="/prime-ae-logo-white.png"
						alt="PRIME AE"
						width={96}
						height={32}
						className={styles.logo}
					/>
					<span className={styles.rule} aria-hidden />
					<p className={styles.product}>Prime Pulse</p>
				</div>
				<div className={styles.actions}>
					<nav aria-label="Prime Pulse" className={styles.nav}>
						{links.map((link) => (
							<Link
								key={link.to}
								to={link.to}
								activeOptions={{ exact: link.exact }}
								className={styles.navLink}
								activeProps={{ className: styles.navLinkActive }}
							>
								{link.label}
							</Link>
						))}
					</nav>
					<ThemePicker />
				</div>
			</header>
			<div className={styles.body}>
				<div>
					<h1 className={styles.heading}>{heading}</h1>
					<p className={onPage.muted}>{title}</p>
				</div>
				<main className={styles.main}>{children}</main>
			</div>
		</div>
	);
}
