import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import type { UpcomingSend } from "#/lib/types";

type ViewerProps = { send: UpcomingSend };

export function EmailPreviewDialog({
	send,
	onOpenChange,
}: {
	send: UpcomingSend | null;
	onOpenChange: (open: boolean) => void;
}) {
	const [Viewer, setViewer] = useState<ComponentType<ViewerProps> | null>(
		null,
	);
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
		<Dialog open={send != null} onOpenChange={onOpenChange}>
			<DialogContent className="grid h-[min(52rem,calc(100vh-3rem))] w-[min(56rem,calc(100vw-2rem))] max-w-4xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden border-[var(--line)] bg-white p-0 sm:max-w-4xl sm:rounded-xl">
				<DialogHeader className="shrink-0 space-y-1 border-b border-[var(--line)] px-6 py-4 pr-12 text-left">
					<DialogTitle>Email preview</DialogTitle>
					<DialogDescription>
						{send
							? `${send.templateName} · ${send.recipientName}`
							: "How this note would look."}
					</DialogDescription>
				</DialogHeader>
				<div className="min-h-0 flex-1 bg-white">
					{loadError ? (
						<p className="p-6 text-sm text-destructive" role="alert">
							{loadError}
						</p>
					) : send && Viewer ? (
						<Viewer send={send} />
					) : (
						<p className="p-6 text-sm text-[var(--sea-ink-soft)]">
							Preparing preview…
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
