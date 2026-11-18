import { createFileRoute } from "@tanstack/react-router";
import { UpcomingScreen } from "#/components/upcoming-screen";

export const Route = createFileRoute("/upcoming")({
	component: UpcomingScreen,
});
