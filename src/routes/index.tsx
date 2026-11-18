import { createFileRoute } from "@tanstack/react-router";
import { TemplatesScreen } from "#/components/templates-screen";

export const Route = createFileRoute("/")({
	component: TemplatesScreen,
});
