import toast from "react-hot-toast";

export function toastAction(message: string) {
	toast.success(message);
}

export function toastError(message: string) {
	toast.error(message);
}

export function actionErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}
