import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement as h } from "react";
import {
	Document,
	Font,
	Image,
	Page,
	Text,
	View,
	StyleSheet,
	renderToFile,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

const ink = "#231b4b";
const orange = "#ce451d";
const muted = "#3d3568";
const line = "#d5d3e4";
const paper = "#f7f6fb";
const brandDir = join(process.cwd(), "docs", "brand");

const styles = StyleSheet.create({
	page: {
		paddingTop: 36,
		paddingBottom: 46,
		paddingHorizontal: 40,
		fontFamily: "Helvetica",
		fontSize: 9,
		lineHeight: 1.38,
		color: ink,
	},
	kicker: {
		fontSize: 8,
		letterSpacing: 1.2,
		color: orange,
		marginBottom: 4,
		fontFamily: "Helvetica-Bold",
	},
	h1: {
		fontSize: 18,
		fontFamily: "Helvetica-Bold",
		marginBottom: 6,
		color: ink,
	},
	h2: {
		fontSize: 12,
		fontFamily: "Helvetica-Bold",
		marginTop: 11,
		marginBottom: 4,
		color: ink,
	},
	h3: {
		fontSize: 10,
		fontFamily: "Helvetica-Bold",
		marginTop: 7,
		marginBottom: 2,
		color: ink,
	},
	p: { marginBottom: 4 },
	li: { marginBottom: 2, paddingLeft: 10 },
	mono: {
		fontFamily: "Courier",
		fontSize: 7.5,
		lineHeight: 1.35,
		marginBottom: 2,
	},
	note: {
		backgroundColor: paper,
		borderLeftWidth: 3,
		borderLeftColor: orange,
		padding: 8,
		marginTop: 4,
		marginBottom: 6,
	},
	row: {
		flexDirection: "row",
		borderBottomWidth: 0.4,
		borderBottomColor: line,
		paddingVertical: 2.5,
	},
	head: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: ink,
		paddingBottom: 3,
		marginTop: 4,
	},
	th: { fontFamily: "Helvetica-Bold", fontSize: 7 },
	td: { fontSize: 7 },
	logos: {
		flexDirection: "row",
		gap: 8,
		marginTop: 6,
		marginBottom: 4,
	},
	logoCard: {
		flex: 1,
		borderWidth: 0.5,
		borderColor: line,
		borderRadius: 4,
		padding: 8,
		alignItems: "center",
	},
	logoDark: {
		backgroundColor: "#231b4b",
		borderRadius: 3,
		paddingVertical: 8,
		paddingHorizontal: 6,
		marginBottom: 4,
		width: "100%",
		alignItems: "center",
	},
	logoLight: {
		backgroundColor: "#ffffff",
		borderRadius: 3,
		paddingVertical: 8,
		paddingHorizontal: 6,
		marginBottom: 4,
		width: "100%",
		alignItems: "center",
	},
	logoImg: { height: 36, width: 64 },
	logoCap: { fontSize: 7.5, textAlign: "center" },
	footer: {
		position: "absolute",
		bottom: 20,
		left: 40,
		right: 40,
		fontSize: 7.5,
		color: muted,
		flexDirection: "row",
		justifyContent: "space-between",
	},
});

function P(text) {
	return h(Text, { style: styles.p }, text);
}
function Li(text) {
	return h(Text, { style: styles.li }, `-  ${text}`);
}
function H2(text) {
	return h(Text, { style: styles.h2 }, text);
}
function H3(text) {
	return h(Text, { style: styles.h3 }, text);
}
function Note(children) {
	return h(View, { style: styles.note }, children);
}

function Cell(text, width, header) {
	return h(Text, { style: [header ? styles.th : styles.td, { width }] }, text);
}

function Row(cells, widths, header = false) {
	return h(
		View,
		{ style: header ? styles.head : styles.row },
		cells.map((cell, index) => Cell(cell, widths[index], header)),
	);
}

function PageShell(children) {
	return h(
		Page,
		{ size: "LETTER", style: styles.page },
		...children,
		h(
			View,
			{ style: styles.footer, fixed: true },
			h(Text, null, "PRIME AE ecosystem design guidelines"),
			h(Text, {
				render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`,
			}),
		),
	);
}

function logoSrc(file) {
	const bytes = readFileSync(join(brandDir, file));
	return `data:image/png;base64,${bytes.toString("base64")}`;
}

function LogoCard(file, caption, dark) {
	return h(
		View,
		{ style: styles.logoCard },
		h(
			View,
			{ style: dark ? styles.logoDark : styles.logoLight },
			h(Image, { src: logoSrc(file), style: styles.logoImg }),
		),
		h(Text, { style: styles.logoCap }, caption),
	);
}

const sw = ["18%", "16%", "14%", "18%", "16%", "18%"];
const themeCols = ["16%", "16%", "8%", "15%", "15%", "15%", "15%"];
const pairCols = ["28%", "72%"];

const doc = h(
	Document,
	{
		title: "PRIME AE ecosystem design guidelines",
		author: "PRIME AE",
		subject: "Brand book colors, logo, and UI rules so every product feels like one family",
	},
	PageShell([
		h(Text, { style: styles.kicker }, "FOR PRODUCT TEAMS AND IMPLEMENTING AGENTS"),
		h(Text, { style: styles.h1 }, "PRIME AE ecosystem design guidelines"),
		P(
			"Use this so every PRIME AE web product looks like it belongs to the same family. The color values come from PRIME AE Brand Book & Style Guide, Color (page 53) and Color Usage (page 54). The chrome comes from the Operations Management Portal: same bar, same five themes, same Fluent controls.",
		),
		Note([
			P(
				"Copy the palette and the theme ids exactly. Do not invent a second orange, a second indigo, or a second header. One primary clickable per view. Supporting actions stay secondary.",
			),
		]),
		H2("1. Logo"),
		P(
			"Three official marks. The mountain and the wordmark stay together. Do not recolor, outline, shadow, rotate, or crop the mountain off the word. Do not redraw it.",
		),
		h(
			View,
			{ style: styles.logos },
			LogoCard("prime-ae-logo-color.png", "Full color. Light surfaces only.", false),
			LogoCard("prime-ae-logo-white.png", "White. Dark bars and dark pages.", true),
			LogoCard("prime-ae-logo-black.png", "Black. Single-color on white.", false),
		),
		Li("Full color: wordmark indigo #24338a, mountain orange #f15d2a. Use on white or light grey. Do not put it on orange, indigo, or navy; the mountain or the word disappears."),
		Li("White: the only mark in the app bar, and on any dark page or dark card. Height 30px in the 48px bar, width auto. alt text \"PRIME AE\"."),
		Li("Black: single-color print on white. Not for product UI."),
		Li("Clear space around the mark at least the height of the \"AE\". Do not set type inside that space."),
		H2("2. How products stay uniform"),
		Li("Same logo treatment, same palette, same five theme ids, same 48px bar."),
		Li("Controls are Fluent UI React v9 (makeStyles and tokens). Icons on chrome are Fluent icons."),
		Li("Type is Segoe UI through Fluent. Do not load a second face for UI."),
		Li("Cards, inputs, menus, and grids use Fluent tokens. The page and the bar use the shell variables in section 5."),
		Li("Toasts confirm an action. A message bar states page status. Do not also leave a success banner on the page."),
		Li("Do not add Tailwind, shadcn, or a global link color. A global a { color } rule beats component text."),
	]),
	PageShell([
		H2("3. Brand book palette"),
		P(
			"From Brand Book page 53. Primary is white, the oranges, the indigos, and the indigo tints. Secondary accents are turquoise, jade, and dandelion. Pair indigo and orange with at most one accent.",
		),
		H3("Primary"),
		Row(["Name", "Pantone", "CMYK", "RGB", "Hex", "Use"], sw, true),
		Row(["White", "", "0 0 0 0", "255 255 255", "#FFFFFF", "Page cards, on-brand text"], sw),
		Row(["Bright Orange", "1665 C", "0 79 93 0", "241 93 42", "#f15d2a", "Brand orange. Not small text on grey."], sw),
		Row(["Dark Orange", "", "0 84 100 16", "206 69 29", "#ce451d", "Bar and shell CTA. White text 4.67:1."], sw),
		Row(["Dark Indigo", "", "87 87 20 54", "35 27 75", "#231b4b", "Navy page. PRIME Light and Dark."], sw),
		Row(["Bright Indigo", "2756 C", "100 94 0 10", "36 51 138", "#24338a", "Brand fill. Light theme brand background."], sw),
		Row(["Light Indigo", "", "76 67 0 0", "84 98 173", "#5462ad", "Dark-theme brand fill. Classic Dark CTA."], sw),
		Row(["Tint Indigo", "", "18 15 6 0", "206 206 220", "#cecedc", "Borders, secondary fills"], sw),
		Row(["Tint Indigo 50%", "", "9 8 3 0", "231 231 238", "#e7e7ee", "Soft secondary surface"], sw),
		Row(["Tint Indigo 25%", "", "5 4 1 0", "241 243 247", "#f1f3f7", "Paper page. Lightest tint."], sw),
		P(
			"The printed white chip in the brand book is labeled Hex #000000. That label does not match RGB 255 255 255. Use #FFFFFF.",
		),
		H3("Secondary accents"),
		Row(["Name", "Pantone", "CMYK", "RGB", "Hex", "Use"], sw, true),
		Row(["Turquoise", "3125 C", "87 12 24 0", "0 163 188", "#00a3bc", "One accent with indigo, not a second brand"], sw),
		Row(["Jade", "3405 C", "80 0 74 3", "0 173 114", "#00ad72", "One accent with indigo. Success may use Fluent success."], sw),
		Row(["Dandelion", "123 C", "0 23 86 0", "255 198 62", "#ffc63e", "Accent only. Alpha pill is this yellow with navy text."], sw),
		H2("4. Color usage"),
		P("From Brand Book page 54. Proportions are a guide, not a pixel count."),
		H3("Proportions"),
		Li("Mostly bright indigo, with a small orange slice and white."),
		Li("Mostly dark indigo, with an orange accent."),
		Li("A split of bright indigo and light indigo, with no third hue."),
		H3("Combinations"),
		Li("Monochrome: tints of one hue. Or accent: indigo and orange plus one secondary."),
		Li("Allowed accent sets: dark indigo + bright indigo + jade; indigo tints + turquoise; bright indigo + orange + dandelion."),
		Li("Do not add turquoise and jade and dandelion on the same view. One accent."),
		H3("Clickable elements (web)"),
		Li("Only one PRIMARY control per view. It is a filled brand button: orange on a light or navy page, or indigo when orange would collide with the page."),
		Li("Every other clickable control is SECONDARY: tint fill, outline, or subtle. Two filled orange buttons on one view is the combination the brand book crosses out."),
		Li("In the app, Fluent appearance=primary is the one primary (indigo brand ramp). The orange shell CTA is the bar's active item, not a second primary button on the page."),
		H3("Accessibility"),
		Li("Foreground and background pairs meet WCAG 2.0 AA."),
		Li("White text is allowed on dark orange, bright orange (large or non-text only if the pair fails AA), bright indigo, dark indigo, turquoise, and jade."),
		Li("White text fails on white, the indigo tints, light indigo, and dandelion. Put navy #231b4b on those."),
		Li("Do not set #f15d2a as small text on neutral grey. That is why Classic Dark has no orange."),
	]),
	PageShell([
		H2("5. Five themes"),
		P(
			"A theme is two axes. Fluent's light or dark ramp paints cards, inputs, menus, and grids. The shell paints the bar and the page. Store the id, never the display name. Order in the picker is this order. A new visitor follows the OS: PRIME Dark if the system prefers dark, otherwise PRIME Light.",
		),
		Row(["id", "name", "dark", "bar", "page", "card", "CTA"], themeCols, true),
		Row(["prime-light", "PRIME Light", "no", "#ce451d", "#231b4b", "#FFFFFF", "orange"], themeCols),
		Row(["prime-dark", "PRIME Dark", "yes", "#ce451d", "#231b4b", "#2e245f", "orange"], themeCols),
		Row(["classic-dark", "Classic Dark", "yes", "#24338a", "#1f1f1f", "#292929", "indigo"], themeCols),
		Row(["paper", "Paper", "no", "#24338a", "#f1f3f7", "#FFFFFF", "orange"], themeCols),
		Row(["indigo", "Indigo", "no", "#ce451d", "#24338a", "#FFFFFF", "orange"], themeCols),
		Li("PRIME Light: navy page, white cards, orange bar. Description: Navy page, white cards."),
		Li("PRIME Dark: navy page and navy cards. Description: Navy page and cards. Only this theme re-tints Fluent neutrals to navy."),
		Li("Classic Dark: grey page, indigo bar, indigo CTA. No orange. Description: Neutral grey, indigo accents."),
		Li("Paper: tint 25% page #f1f3f7, indigo bar, orange CTA. Description: Light grey page, indigo bar."),
		Li("Indigo: bright indigo page, white cards, orange bar. Brand-filled cards need a 1px white hairline at 35% opacity so they still have an edge. Description: Brand indigo page, white cards."),
		H3("Shell variables"),
		P("Emit these on the Fluent provider. They are not Fluent tokens. Fluent owns the card."),
		Row(["Token", "Meaning"], pairCols, true),
		Row(["--prime-header-bg / fg / hover / pressed", "Bar fill, bar text, bar hover, bar pressed"], pairCols),
		Row(["--prime-page-bg / fg / fg-muted / fg-disabled", "Page fill and page text"], pairCols),
		Row(["--prime-page-hover / pressed / stroke", "Controls drawn on the page"], pairCols),
		Row(["--prime-cta-bg / bg-hover / bg-pressed / fg", "The one shell CTA (active bar item)"], pairCols),
		H3("Recipes"),
		Row(["Recipe", "Values"], pairCols, true),
		Row(["onDarkPage", "fg #FFFFFF; muted white 74%; disabled 42%; hover 10%; pressed 18%; stroke 55%"], pairCols),
		Row(["onLightPage", "fg #231b4b; muted navy 72%; disabled 42%; hover 6%; pressed 12%; stroke 38%"], pairCols),
		Row(["orangeBar", "bg #ce451d; fg #FFFFFF; hover white 14%; pressed white 22%"], pairCols),
		Row(["indigoBar", "same as orangeBar, bg #24338a"], pairCols),
		Row(["orangeCta", "bg #ce451d; hover #b03a17; pressed #8f2e11; fg #FFFFFF"], pairCols),
		P(
			"Browser key is omp:theme. The value is the theme id. Unknown ids are ignored. Inside a card, use tokens. On the page, use --prime-page-fg. On the bar, use --prime-header-*.",
		),
	]),
	PageShell([
		H2("6. App bar"),
		P("Every product uses this bar. People should recognize it from a screenshot."),
		Li("Fixed to the top, height 48px, full width, z-index above page content. Grid: auto, 1fr, auto. Align center. Gap 12px. Padding 16px, 12px below 768px."),
		Li("Background --prime-header-bg, text --prime-header-fg. Elevation is Fluent shadow8. No second colored rule under the bar."),
		Li("Left: home link. White logo at 30px, then a 1px rule rgba(255,255,255,0.45) with 12px space, then the product name at 16px regular, letter-spacing 0.01em, line-height 22px. Not bold, not uppercase, not the words PRIME AE. Examples: OMP, Prime Pulse."),
		Li("Center stays empty. It is reserved. Do not put navigation there."),
		Li("Right: theme picker, then the account menu if the product has one. Restyle buttons in this cluster with header tokens so hover and disabled states follow the bar."),
		Li("Theme picker: Fluent menu, one radio group titled Theme. Each row is a 32 by 24 swatch (page, 6px bar, inset card) plus the name and the description. Accessible name is Theme: {name}."),
		Li("Account menu: avatar 28, name (hidden below 768px), chevron. Menu shows name, secondary line, feedback, and sign out."),
		Li("Breadcrumbs sit on the page under the bar, not in a card. First crumb is Home. Current crumb is disabled. Text is --prime-page-fg; dividers and the current crumb are muted."),
		Li("A small tool may put two to four section links in the right cluster, before the picker. The current one uses the CTA variables. Inactive links are text only. Do not add a sidebar or a second bar."),
		H2("7. Page and navigation"),
		Li("Page background --prime-page-bg, text --prime-page-fg. Content centered, padding 16px, max width 1400px. Forms stay within 768px. A wide grid may go to about 1800px."),
		Li("The page title is an h1 on the page, not inside a card."),
		Li("A hub home is a launcher of brand-filled cards, not a chart dashboard. One column, two columns from 640px."),
		Li("Brand card: see section 14. Fluent card, background colorBrandBackground, foreground on-brand, border 1px solid rgba(255,255,255,0.35). Horizontal row, icon then label, both vertically centered."),
		Li("Info card with a blurb uses the same fill. Hover lifts 2px and deepens the shadow. Keyboard: tabIndex 0, Enter activates."),
		Li("While access is loading, show a spinner. If nothing is available, say so in a heading."),
		Li("Deeper pages use breadcrumbs plus an in-page title. Do not repeat the wordmark."),
		H2("8. Surfaces"),
		Row(["Surface", "Rule"], pairCols, true),
		Row(["Page", "Shell colors. Titles, breadcrumbs, empty copy."], pairCols),
		Row(["Neutral card", "Neutral background and foreground. Large radius. Light shadow. Hairline colorNeutralStroke2."], pairCols),
		Row(["Brand card", "Launcher and notification. Brand fill, on-brand text, white hairline."], pairCols),
		Row(["Form", "Centered card, max 768px, generous padding. Labels are Fluent fields, bold."], pairCols),
		Row(["Form section", "Titled card. Semibold title, muted description, optional actions, hairline under the header."], pairCols),
		Row(["Value tile", "Uppercase label, tracking 0.04em, over a semibold tabular value. Empty is an em dash."], pairCols),
		Row(["Metric chip", "Flex, min about 140px. Uppercase label, bold tabular value."], pairCols),
		Row(["Document", "Email and PDF previews stay white. Do not theme them."], pairCols),
	]),
	PageShell([
		H2("9. Controls"),
		Li("One primary button per view: appearance primary, indigo brand fill. Never recolor it orange."),
		Li("Secondary is the alternate. Subtle is low emphasis (picker, dismiss). Transparent is the account button on the bar. Outline is a chip."),
		Li("Small size for actions in a row. Icon-only buttons need an accessible name."),
		Li("Fields use label, hint, and validation message. A group of checkboxes is a fieldset with a legend."),
		Li("Validation text on a card uses the Fluent red foreground. The default danger color is too dark on navy cards."),
		Li("Wizards: back on the left, next or submit on the right. Do not build a second stepper that fights the breadcrumbs."),
		Li("Status badges use Fluent tint: completed success, in progress informative, in review warning, otherwise subtle."),
		Li("An alpha pill is always #ffc63e with text #231b4b. It does not follow the theme."),
		Li("Data grids may be AG Grid. Bind their colors to Fluent neutrals so they follow the five themes."),
		H2("10. Feedback"),
		Li("Short success and error: a toast. Click or Enter or Space dismisses it. No leftover success banner."),
		Li("Read-only or page-level warning: a message bar with a title, body, and optional action."),
		Li("Loading: a labeled spinner when the wait is more than a flicker."),
		Li("Missing page: short title, primary action back to home. Not allowed: short title, secondary action back to home."),
		Li("After a failed submit, scroll the first invalid field into view and focus it."),
		H2("11. Motion, small screens, print"),
		Li("The only standard hover motion is the info card lift, about 0.1s. Do not bounce launcher cards."),
		Li("Below 768px, tighten bar padding and hide the account name. Keep the 30px mark and the product name."),
		Li("Launcher is one column below 640px."),
		Li("Print hides the bar and action buttons. Content uses the full width."),
		H2("12. Do and do not"),
		Row(["", ""], ["18%", "82%"], true),
		Row(["Do", "Ship the five themes, omp:theme, the 48px bar, the 30px white mark, the hairline, and the regular product name."], ["18%", "82%"]),
		Row(["Do", "Paint cards with Fluent tokens and the page with shell variables."], ["18%", "82%"]),
		Row(["Do", "Keep one primary control per view. Keep orange on the bar and the shell CTA only."], ["18%", "82%"]),
		Row(["Do", "Put forms on a card. Put launcher destinations on brand cards with the white hairline."], ["18%", "82%"]),
		Row(["Do not", "Invent a palette, rename theme ids, or default to Paper, Indigo, or Classic Dark."], ["18%", "82%"]),
		Row(["Do not", "Recolor the logo, split the mountain from the word, or put the full-color mark on a dark bar."], ["18%", "82%"]),
		Row(["Do not", "Put two primary orange buttons on one view, or put orange on Classic Dark."], ["18%", "82%"]),
		Row(["Do not", "Bold or uppercase the product name, skip the hairline, or change the mark from 30px."], ["18%", "82%"]),
		Row(["Do not", "Add a sidebar or a second bar. Breadcrumbs are not a second bar."], ["18%", "82%"]),
		Row(["Do not", "Apply the navy card ramp outside PRIME Dark, or theme an email or PDF preview."], ["18%", "82%"]),
		H2("13. Checklist"),
		Li("Palette matches section 3, including #FFFFFF for white and #24338a for bright indigo."),
		Li("Logo files are the official three. The bar uses the white mark at 30px."),
		Li("Theme module exports the five themes, findTheme, systemDefaultTheme, and THEME_STORAGE_KEY = omp:theme."),
		Li("Provider paints the shell variables. Picker lists all five, in order, with swatches."),
		Li("All five themes checked: bar, page, card, CTA, and page text. Classic Dark has no orange. PRIME Dark cards are navy. Indigo launcher cards still have an edge."),
		Li("One primary button on each view. Secondary actions are outline, subtle, or tint."),
		Li("Hard reload does not flash the wrong theme. If the app renders on the server first, cover that first paint with a navy #231b4b splash and the white mark, then reveal. The splash is not a theme."),
		Li("A hub home matches section 14. Classic Dark shows an indigo bar, a grey page, indigo cards, white labels, and no orange."),
		Note([
			P(
				"Color source: PRIME AE Brand Book & Style Guide, pages 53 and 54. Chrome source: the Operations Management Portal bar, theme catalog, and Fluent cards. If those sources change, regenerate this PDF from scripts/export-ecosystem-guidelines.mjs.",
			),
		]),
	]),
	PageShell([
		H2("14. Reference screen: hub home"),
		P(
			"Build a hub home to this layout. It is the screen that proves the guidelines. The example title is Operations Management Portal and the example product name in the bar is OMP. Swap those words for the product. Do not add charts, stats, or a second navigation.",
		),
		H3("Stack, top to bottom"),
		Li("Bar from section 6. White mark, hairline, product name at regular weight. Right side: theme picker, then account (avatar 28, name, chevron). Center of the bar stays empty."),
		Li("Breadcrumb on the page, full width, left aligned, same horizontal padding as the bar. On this screen the only crumb is Home, and it is the current page, so it is not a link. Color is --prime-page-fg."),
		Li("Launcher column centered in the page, max width 960px. The breadcrumb does not move inward with it."),
		Li("h1 centered in that column, on the page, not in a card. About 20px, semibold, color --prime-page-fg. Margin below about 16px."),
		Li("Then the card grid. Nothing else."),
		H3("Launcher cards"),
		Li("Grid: one column below 640px, two equal columns from 640px. Gap 16px. Cards stretch to the cell. They are short bars, not tall tiles."),
		Li("Each card is a Fluent Card and a button. Min height about 56px. Padding 12px 16px. Radius medium. Row, align center, gap 16px."),
		Li("Icon: line icon, 24px, white, in a 40px slot so every label starts at the same x. Do not use a 64px icon."),
		Li("Label: one line, 16px, white, left aligned, vertically centered with the icon."),
		Li("Fill tokens.colorBrandBackground. Text tokens.colorNeutralForegroundOnBrand. Border 1px solid rgba(255,255,255,0.35). That hairline is what keeps the card visible on the Indigo theme."),
		Li("Whole card is the hit target. Keyboard: tabIndex 0, Enter activates. Do not bounce the card on hover."),
		H3("Theme menu, open"),
		Li("Fluent menu anchored to the color icon, opening downward on the right. Do not draw a custom dropdown."),
		Li("Group title Theme. Five radio rows, catalog order: PRIME Light, PRIME Dark, Classic Dark, Paper, Indigo."),
		Li("Each row: 32 by 24 swatch (6px bar across the top, page fill, small card inset), then the name and the description on two lines. The selected row shows a check."),
		Li("Descriptions: Navy page, white cards. Navy page and cards. Neutral grey, indigo accents. Light grey page, indigo bar. Brand indigo page, white cards."),
		H3("Classic Dark, the check for this screen"),
		Li("Bar #24338a, bar text #FFFFFF. Page #1f1f1f. Cards are the lifted indigo brand fill (about #3d3486), not grey and not orange. Labels and icons #FFFFFF."),
		Li("No orange anywhere: not the bar, not the title, not the cards, not a focus outline painted as a second brand."),
		Li("PRIME Light on the same screen keeps this layout and swaps colors only: orange bar #ce451d, navy page #231b4b, white is not the card fill here because these cards are brand-filled. Cards stay colorBrandBackground, which is #24338a in the light themes."),
		H3("Pass"),
		Li("A screenshot of Classic Dark matches this section: indigo bar, grey page, centered title, two columns of short indigo cards, white icons and labels, Home at the left under the bar, theme menu with five swatches."),
		Li("Switching the theme does not move the layout. Only the shell and the Fluent ramp change."),
	]),
);

const out = join(process.cwd(), "docs", "PRIME-AE-Ecosystem-Design-Guidelines.pdf");
await renderToFile(doc, out);
console.log("wrote", out);
