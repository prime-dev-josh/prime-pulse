import { useEffect, useState } from "react";
import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
	pdf,
} from "@react-pdf/renderer";
import { formatDate, formatSendAt } from "#/lib/dates";
import type { UpcomingSend } from "#/lib/types";
import { TEMPLATE_KIND_COPY } from "#/lib/types";

const indigo = "#24338a";
const orange = "#f15d2a";
const ink = "#231b4b";
const muted = "#5462ad";

const styles = StyleSheet.create({
	page: {
		fontFamily: "Helvetica",
		fontSize: 11,
		color: ink,
		paddingTop: 0,
		paddingBottom: 36,
		paddingHorizontal: 40,
	},
	header: {
		backgroundColor: indigo,
		marginHorizontal: -40,
		paddingHorizontal: 40,
		paddingVertical: 14,
		flexDirection: "row",
		alignItems: "center",
		borderBottomWidth: 4,
		borderBottomColor: orange,
	},
	logo: {
		width: 64,
		height: 36,
		marginRight: 12,
		objectFit: "contain",
	},
	brand: {
		color: "#ffffff",
		fontSize: 14,
		fontFamily: "Helvetica-Bold",
	},
	kind: {
		color: "#ffffff",
		fontSize: 9,
		marginTop: 3,
	},
	meta: {
		marginTop: 22,
		paddingBottom: 14,
		borderBottomWidth: 1,
		borderBottomColor: "#cecedc",
	},
	row: {
		flexDirection: "row",
		marginBottom: 8,
	},
	label: {
		width: 72,
		color: muted,
		fontSize: 9,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
		paddingTop: 1,
	},
	value: {
		flex: 1,
		fontSize: 11,
		lineHeight: 1.4,
	},
	body: {
		marginTop: 20,
	},
	line: {
		lineHeight: 1.55,
		marginBottom: 2,
	},
	footer: {
		position: "absolute",
		bottom: 18,
		left: 40,
		right: 40,
		fontSize: 8,
		color: muted,
	},
});

function MetaRow({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.row}>
			<Text style={styles.label}>{label}</Text>
			<Text style={styles.value}>{value}</Text>
		</View>
	);
}

function EmailPreviewDocument({
	send,
	logoSrc,
}: {
	send: UpcomingSend;
	logoSrc?: string;
}) {
	const lines = send.bodyPreview.split("\n");
	const toLine = [
		send.recipientName,
		send.recipientEmails.length
			? send.recipientEmails.join(", ")
			: "No email on file",
	].join("\n");

	return (
		<Document title={send.subjectPreview} author="Prime Pulse">
			<Page size="LETTER" style={styles.page}>
				<View style={styles.header}>
					{logoSrc ? <Image src={logoSrc} style={styles.logo} /> : null}
					<View>
						<Text style={styles.brand}>Prime Pulse</Text>
						<Text style={styles.kind}>
							{TEMPLATE_KIND_COPY[send.kind].label}
						</Text>
					</View>
				</View>
				<View style={styles.meta}>
					<MetaRow label="To" value={toLine} />
					<MetaRow label="Subject" value={send.subjectPreview} />
					<MetaRow
						label="Send date"
						value={`${formatDate(send.sendDate)} at ${formatSendAt(send.sendAt)} ET`}
					/>
					<MetaRow label="Template" value={send.templateName} />
				</View>
				<View style={styles.body}>
					{lines.map((line, index) => (
						<Text key={`${index}-${line.slice(0, 12)}`} style={styles.line}>
							{line.length ? line : " "}
						</Text>
					))}
				</View>
				<Text style={styles.footer}>
					Preview only. Nothing is sent from this screen.
				</Text>
			</Page>
		</Document>
	);
}

export function EmailPdfViewer({ send }: { send: UpcomingSend }) {
	const [url, setUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let objectUrl: string | null = null;
		let cancelled = false;
		setUrl(null);
		setError(null);
		const logoSrc = `${window.location.origin}/prime-ae-logo-white.png`;
		void pdf(<EmailPreviewDocument send={send} logoSrc={logoSrc} />)
			.toBlob()
			.then((blob) => {
				if (cancelled) return;
				objectUrl = URL.createObjectURL(blob);
				setUrl(objectUrl);
			})
			.catch((reason) => {
				if (cancelled) return;
				setError(
					reason instanceof Error ? reason.message : "Could not build preview",
				);
			});
		return () => {
			cancelled = true;
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [send]);

	if (error) {
		return (
			<p className="p-6 text-sm text-destructive" role="alert">
				{error}
			</p>
		);
	}
	if (!url) {
		return (
			<p className="p-6 text-sm text-[var(--sea-ink-soft)]">
				Preparing preview…
			</p>
		);
	}
	return (
		<iframe
			title="Email preview"
			src={url}
			className="h-full w-full border-0 bg-white"
		/>
	);
}
