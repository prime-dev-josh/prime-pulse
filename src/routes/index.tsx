import { createFileRoute } from "@tanstack/react-router";
import { PulseScreen } from "#/components/pulse-screen";

export const Route = createFileRoute("/")({
	component: PulseScreen,
});
