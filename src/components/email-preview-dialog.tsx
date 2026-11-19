import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogSurface,
	DialogTitle,
	makeStyles,
	tokens,
} from "@fluentui/react-components";
import { useEffect, useState, type ComponentType } from "react";
import type { UpcomingSend } from "#/lib/types";

type ViewerProps = { send: UpcomingSend };

const useStyles = makeStyles({
	surface: {
		width: "min(56rem, calc(100vw - 2rem))",
		maxWidth: "56rem",
		height: "min(52rem, calc(100vh - 3rem))",
	},
	body: {
		display: "grid",
		gridTemplateRows: "auto minmax(0, 1fr)",
		height: "100%",
		gap: 0,
	},
	frame: {
		minHeight: 0,
		overflow: "hidden",
		backgroundColor: "#ffffff",
	},
	note: {
		padding: "24px",
		color: tokens.colorNeutralForeground3,
	},
});

export function EmailPreviewDialog({
	send,
	onOpenChange,
}: {
	send: UpcomingSend | null;
	onOpenChange: (open: boolean) => void;
}) {
	const styles = useStyles();
	const [Viewer, setViewer] = useState<ComponentType<ViewerProps> | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		if (!send || Viewer) return;
		void import("./email-preview-pdf")
			.then((mod) => {
				setViewer(() => mod.EmailPdfViewer);
			})
			.catch((reason) => {
				setLoadError(
					reason instanceof Error
						? reason.message
						: "Could not load the PDF preview",
				);
			});
	}, [send, Viewer]);

	return (
		<Dialog
			open={send != null}
			onOpenChange={(_, data) => onOpenChange(data.open)}
		>
			<DialogSurface className={styles.surface}>
				<DialogBody className={styles.body}>
					<DialogTitle>
						Email preview
						<div style={{ fontWeight: 400, fontSize: "14px" }}>
							{send
								? `${send.templateName} · ${send.recipientName}`
								: "How this note would look."}
						</div>
					</DialogTitle>
					<DialogContent className={styles.frame}>
						{loadError ? (
							<p className={styles.note} role="alert">
								{loadError}
							</p>
						) : send && Viewer ? (
							<Viewer send={send} />
						) : (
							<p className={styles.note}>Preparing preview…</p>
						)}
					</DialogContent>
				</DialogBody>
			</DialogSurface>
		</Dialog>
	);
}
