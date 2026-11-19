import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "react-hot-toast";
import { PrimeSplash, SPLASH_CSS } from "#/theme/PrimeSplash";
import { PrimeThemeProvider } from "#/theme/PrimeThemeProvider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Prime Pulse · PRIME AE",
			},
			{
				name: "description",
				content:
					"Email templates for employee milestones, manager monthly reports, and CEO anniversary marks",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "/prime-ae-logo-color.png",
			},
			{
				rel: "apple-touch-icon",
				href: "/prime-ae-logo-color.png",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<style dangerouslySetInnerHTML={{ __html: SPLASH_CSS }} />
			</head>
			<body>
				<PrimeSplash />
				<PrimeThemeProvider>
					{children}
					<Toaster position="bottom-center" />
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				</PrimeThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}
