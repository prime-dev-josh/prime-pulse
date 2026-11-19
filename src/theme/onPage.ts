import { makeStyles } from "@fluentui/react-components";

/** Text drawn on the page, not inside a Fluent card. */
export const useOnPageStyles = makeStyles({
	field: {
		"& .fui-Field__label": {
			color: "var(--prime-page-fg)",
		},
		"& .fui-Field__hint": {
			color: "var(--prime-page-fg-muted)",
		},
	},
	text: {
		color: "var(--prime-page-fg)",
	},
	muted: {
		color: "var(--prime-page-fg-muted)",
	},
});
