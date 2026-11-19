import { toast as sonnerToast } from "sonner";

export function toastAction(message: string) {
	sonnerToast.success(message);
}

export function toastError(message: string) {
	sonnerToast.error(message);
}

export function actionErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}