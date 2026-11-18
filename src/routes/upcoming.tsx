import { createFileRoute } from "@tanstack/react-router";
import { UpcomingScreen } from "#/components/upcoming-screen";

type UpcomingSearch = {
	date?: string;
};

export const Route = createFileRoute("/upcoming")({
	validateSearch: (search: Record<string, unknown>): UpcomingSearch => {
		const date = search.date;
		if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return { date };
		}
		return {};
	},
	component: function UpcomingRoute() {
		const { date } = Route.useSearch();
		return <UpcomingScreen initialDate={date} />;
	},
});
