import { join } from "node:path";
import { createElement as h } from "react";
import {
	Document,
	Font,
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

const styles = StyleSheet.create({
	page: {
		paddingTop: 40,
		paddingBottom: 48,
		paddingHorizontal: 44,
		fontFamily: "Helvetica",
		fontSize: 9,
		lineHeight: 1.4,
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
		marginTop: 12,
		marginBottom: 4,
		color: ink,
	},
	h3: {
		fontSize: 10,
		fontFamily: "Helvetica-Bold",
		marginTop: 8,
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
		paddingVertical: 3,
	},
	head: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: ink,
		paddingBottom: 3,
		marginTop: 4,
	},
	th: { fontFamily: "Helvetica-Bold", fontSize: 7.5 },
	td: { fontSize: 7.5 },
	footer: {
		position: "absolute",
		bottom: 22,
		left: 44,
		right: 44,
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
function Mono(text) {
	return h(Text, { style: styles.mono }, text);
}

const cols = {
	id: { width: "16%" },
	name: { width: "16%" },
	dark: { width: "8%" },
	bar: { width: "15%" },
	page: { width: "15%" },
	card: { width: "15%" },
	cta: { width: "15%" },
};

function Cell(text, style, header) {
	return h(Text, { style: [header ? styles.th : styles.td, style] }, text);
}

function Row(cells, header = false) {
	const keys = ["id", "name", "dark", "bar", "page", "card", "cta"];
	return h(
		View,
		{ style: header ? styles.head : styles.row },
		cells.map((cell, index) => Cell(cell, cols[keys[index]], header)),
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
			h(Text, null, "PRIME AE theme guidelines"),
			h(Text, {
				render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`,
			}),
		),
	);
}

const doc = h(
	Document,
	{
		title: "PRIME AE theme guidelines",
		author: "PRIME AE",
		subject: "Adopt this theme catalog in any web app",
	},
	PageShell([
		h(Text, { style: styles.kicker }, "FOR AN IMPLEMENTING AGENT"),
		h(Text, { style: styles.h1 }, "PRIME AE theme guidelines"),
		P(
			"Adopt this catalog as-is. Do not invent a parallel palette, rename theme ids, or restyle Fluent with a second design system. The same ids are shared with the PRIME CMS (Models/PrimeThemes.cs) and Project Portal so a person's choice means the same product to product.",
		),
		Note([
			P(
				"Instruction to the agent: install Fluent UI, copy the theme module described here, wrap the app in PrimeThemeProvider, and paint the shell only with the CSS variables in section 4. Cover the first paint with the loading screen in section 12 so unstyled server HTML never shows. Cards, inputs, menus, and dialogs use Fluent tokens. The page behind the cards uses the shell variables. Do not install Tailwind, shadcn, Radix, class-variance-authority, Sonner, next-themes, or lucide-react.",
			),
		]),
		H2("1. Libraries"),
		Li("@fluentui/react-components: every control (Button, Input, Textarea, Field, Checkbox, Dropdown, Menu, Dialog, Card, Badge). Style with makeStyles and tokens."),
		Li("@fluentui/react-icons: icons. Do not mix in another icon set for the same surfaces."),
		Li("react-hot-toast: action confirmations and errors. One Toaster inside the provider."),
		Li("Do not add Tailwind. Its preflight resets fight Fluent. A global `a { color: ... }` rule will beat component text color. Do not write one."),
		Li("Global CSS is a reset only: html, body, and the app root are height 100% with margin 0, body background #231b4b. The provider paints the page after reveal. The loading-screen CSS in section 12 is inline in the document head, not this file."),
		H2("2. Two axes, kept separate"),
		P(
			"A theme is not one dark/light switch. Fluent's ramp (isDark) paints cards, inputs, and menus. The PRIME shell paints the app bar and the page those cards sit on. Classic Dark and PRIME Dark are both Fluent-dark. They differ only in whether the neutral ramp is re-tinted navy.",
		),
		Li("Inside a card, menu, input, or dialog: tokens.colorNeutral* and tokens.colorBrand*. Never hard-code page colors there."),
		Li("On the page, outside cards (title, subtitle, empty state on the page): var(--prime-page-fg) and var(--prime-page-fg-muted)."),
		Li("On the app bar: var(--prime-header-*)."),
		Li("The single filled call to action in the shell (the active nav item): var(--prime-cta-*). Fluent primary buttons stay on the brand ramp. They are not recolored orange."),
		H2("3. Brandbook colors"),
		P("Use these literals. Do not shift them."),
		Mono("orange        #f15d2a    brand orange. Header underline and swatches. Not small text on grey."),
		Mono("orangeDeep    #ce451d    header bar and the orange CTA. White text on this fill is 4.67:1."),
		Mono("orangeDeeper  #b03a17    CTA hover."),
		Mono("cta pressed   #8f2e11"),
		Mono("indigo        #24338a    PANTONE 2756 C. Brand step 80. Light-theme colorBrandBackground."),
		Mono("indigoLight   #5462ad    dark-theme brand fill, and the Classic Dark CTA."),
		Mono("navy          #231b4b    PRIME Light and PRIME Dark page."),
		Mono("grey100       #f1f3f7    Paper page."),
		Mono("grey300       #cecedc"),
		Mono("white         #ffffff"),
		P(
			"The only orange pairing allowed for small text is white on #ce451d. Do not put #f15d2a on neutral grey. That pairing is why Classic Dark has no orange at all: bar and CTA are two different indigo steps, so the CTA is still the brightest fill.",
		),
		H2("4. Shell CSS variables"),
		P(
			"Emit these on the FluentProvider style, spread from theme.shell, and set background to var(--prime-page-bg). They are not Fluent tokens. Fluent owns the card. The shell does not.",
		),
		Mono("--prime-header-bg | --prime-header-fg | --prime-header-hover | --prime-header-pressed"),
		Mono("--prime-page-bg | --prime-page-fg | --prime-page-fg-muted | --prime-page-fg-disabled"),
		Mono("--prime-page-hover | --prime-page-pressed | --prime-page-stroke"),
		Mono("--prime-cta-bg | --prime-cta-bg-hover | --prime-cta-bg-pressed | --prime-cta-fg"),
		H3("Shared recipes"),
		Mono("onDarkPage  fg #ffffff; muted rgba(255,255,255,.74); disabled .42; hover .10; pressed .18; stroke .55"),
		Mono("onLightPage fg #231b4b; muted rgba(35,27,75,.72); disabled .42; hover .06; pressed .12; stroke .38"),
		Mono("orangeBar   bg #ce451d; fg #ffffff; hover rgba(255,255,255,.14); pressed .22"),
		Mono("indigoBar   same as orangeBar, bg #24338a"),
		Mono("orangeCta   bg #ce451d; hover #b03a17; pressed #8f2e11; fg #ffffff"),
		H2("5. The five themes"),
		P(
			"Ids are stable. Store the id, never the display name. Order in the picker is this order.",
		),
		Row(["id", "name", "dark", "bar", "page", "card", "CTA"], true),
		Row(["prime-light", "PRIME Light", "no", "#ce451d", "#231b4b", "#ffffff", "orange"]),
		Row(["prime-dark", "PRIME Dark", "yes", "#ce451d", "#231b4b", "#2e245f", "orange"]),
		Row(["classic-dark", "Classic Dark", "yes", "#24338a", "#1f1f1f", "#292929", "indigo"]),
		Row(["paper", "Paper", "no", "#24338a", "#f1f3f7", "#ffffff", "orange"]),
		Row(["indigo", "Indigo", "no", "#ce451d", "#24338a", "#ffffff", "orange"]),
		P("Descriptions, used as the second line of each picker row:"),
		Li("PRIME Light: Navy page, white cards."),
		Li("PRIME Dark: Navy page and cards."),
		Li("Classic Dark: Neutral grey, indigo accents."),
		Li("Paper: Light grey page, indigo bar."),
		Li("Indigo: Brand indigo page, white cards."),
	]),
	PageShell([
		H2("6. Fluent brand ramp"),
		P(
			"Build BrandVariants from indigo by lightness. Step 80 is exactly #24338a. That pin is what makes colorBrandBackground the real brand color in light themes, instead of the nearest generated step. Do not regenerate this ramp.",
		),
		Mono("10 #040610   20 #080c20   30 #0d1231   40 #111841   50 #151e51"),
		Mono("60 #192461   70 #1e2b76   80 #24338a   90 #2a3ca2   100 #3045ba"),
		Mono("110 #4056ce  120 #5d6fd5  130 #7988dd  140 #9aa5e5  150 #bac2ed"),
		Mono("160 #dadff6"),
		P("const lightBase = createLightTheme(primeBrand); const darkBase = createDarkTheme(primeBrand);"),
		H3("lightBrandPin, every light theme"),
		P("Step 80 is already exact. Pin only the interaction steps."),
		Mono("colorBrandBackground #24338a"),
		Mono("colorBrandBackgroundHover #1e2b76"),
		Mono("colorBrandBackgroundPressed #192461"),
		Mono("colorBrandBackgroundSelected #1e2b76"),
		H3("darkBrandLift, every dark theme"),
		P(
			"The exact-indigo pin leaves Fluent's dark brand colors at #24338a, which disappears on a dark surface. Step them up. This depends only on the surface being dark, not on navy versus grey.",
		),
		Mono("colorBrandForeground1 #a8a5cf    colorBrandForeground2 #b7b4d8    hover #d6d4e9"),
		Mono("colorBrandForegroundLink #a8a5cf  hover #d6d4e9  pressed #8a87be  selected #a8a5cf"),
		Mono("colorBrandBackground #5462ad  hover #6470bd  pressed #4a57a3  selected #4a57a3"),
		Mono("colorBrandBackground2 #3d3486  hover #473d95  pressed #332c70"),
		Mono("colorBrandStroke1 #8a87be    colorBrandStroke2 #4a57a3"),
		Mono("colorNeutralForeground2BrandHover #b7b4d8  pressed #a8a5cf  selected #b7b4d8"),
		Mono("colorNeutralStrokeAccessibleSelected #8a87be"),
		H3("Per-theme Fluent overrides"),
		Li("PRIME Light: { ...lightBase, ...lightBrandPin }. Shell: orangeBar + onDarkPage + orangeCta + page #231b4b. isDark false."),
		Li("PRIME Dark: { ...darkBase, ...darkBrandLift, ...navyNeutrals }. Shell: orangeBar + onDarkPage + orangeCta + page #231b4b. isDark true. Card swatch #2e245f."),
		Li("Classic Dark: { ...darkBase, ...darkBrandLift } then colorBrandBackground #3d3486, hover and selected #473d95, pressed #332c70. No navyNeutrals. Shell page #1f1f1f, indigo bar, CTA bg #5462ad, hover #6470bd, pressed #4a57a3, fg #ffffff. No orange."),
		Li("Paper: { ...lightBase, ...lightBrandPin }. Shell: indigoBar + onLightPage + orangeCta + page #f1f3f7."),
		Li("Indigo: light base and pin, then lift the brand fill so it is not invisible on an indigo page: background #3045ba, hover and selected #4056ce, pressed #2a3ca2. Shell: orangeBar + onDarkPage + orangeCta + page #24338a. A hairline (1px solid tokens.colorNeutralStroke2) still separates white cards from the page, because two steps of one hue cannot reach 3:1 on their own."),
		H2("7. Navy neutrals (PRIME Dark only)"),
		P(
			"Fluent's dark neutral ramp is grey. PRIME Dark re-issues each neutral at the same lightness in the brand navy hue. Classic Dark keeps Fluent's greys on purpose. Copy these values. Do not retint them.",
		),
		Mono("Background1 #2e245f  hover #3a2d78  pressed #281f53  selected #372b71"),
		Mono("Background2 #281f53  hover #34296b  pressed #211a45  selected #312665"),
		Mono("Background3 #211a45  hover #2e245f  pressed #1b1639  selected #2b2259"),
		Mono("Background4 #1b1639  hover #281f53  pressed #15112c  selected #251d4c"),
		Mono("Background5 #15112c  hover #211a45  pressed #181333  selected #1e183f"),
		Mono("Background6 #34296b"),
		Mono("BackgroundAlpha rgba(37,29,76,.5)   Alpha2 rgba(40,31,83,.7)   Disabled #211a45"),
		Mono("Inverted #ffffff   Static #3a2d78"),
		Mono("Card #34296b  disabled #211a45  hover #3a2d78  pressed #312665  selected #372b71"),
		Mono("Foreground1 and its hover/pressed/selected #ffffff    Static #2b2259"),
		Mono("Foreground2 #d2cfdd (hover/pressed/selected #ffffff)   link same"),
		Mono("Foreground3 #a4a0ba (hover/pressed/selected #d2cfdd)"),
		Mono("Foreground4 #8e89a9   Disabled #6a5fa8"),
		Mono("ForegroundInverted, 2, hover, pressed, selected #2b2259"),
		Mono("ForegroundInvertedLink and its states #ffffff"),
		Mono("ForegroundOnBrand #ffffff   StaticInverted #ffffff"),
		Mono("Stencil1 #50438e   Stencil2 #34296b"),
		Mono("Stroke1 #5e5298  hover #6e64a0  pressed #63579c  selected #685d9f"),
		Mono("Stroke2 #4b3e8a   Stroke3 #3a2d78"),
		Mono("StrokeAccessible #a4a0ba  hover #b6b2c8  pressed #aba7bf"),
		Mono("StrokeDisabled #3d307d"),
		Mono("StrokeOnBrand #2e245f   StrokeOnBrand2 and its states #ffffff"),
		Mono("StrokeSubtle #1b1639"),
		Mono("SubtleBackgroundHover #372b71  Pressed #312665  Selected #34296b"),
		Mono("SubtleBackgroundLightAlphaHover rgba(43,34,89,.8)  Pressed rgba(43,34,89,.5)"),
		P("Token names are the Fluent names: colorNeutralBackground1, colorNeutralForeground2LinkHover, and so on. Prefix each row above with colorNeutral."),
	]),
	PageShell([
		H2("8. Provider"),
		P("Export PrimeTheme { id, name, description, isDark, swatch, theme, shell }. swatch is { bar, page, card } using the literals in the table, so a picker row shows its own theme while another theme is active."),
		Li("findTheme(id) returns the entry or undefined. Unknown ids are ignored."),
		Li("systemDefaultTheme(prefersDark) is PRIME Dark when the OS prefers dark, otherwise PRIME Light. That is the brandbook pair. Do not default to Classic Dark, Paper, or Indigo."),
		Li("Storage key is exactly omp:theme. The value is the theme id."),
		Li("First render is always PRIME Light. Read localStorage and matchMedia only in useEffect, after hydration. A server render must not touch localStorage. Keep the loading screen up until that stored theme is applied (section 12)."),
		Li("setTheme updates state and writes localStorage. If storage throws, keep the choice for the session."),
		Li("On each theme: document.body.dataset.primeTheme = id; documentElement.style.colorScheme = dark or light; body.style.background = shell page color."),
		Li("Render FluentProvider theme={theme.theme} style={{ ...theme.shell, background: 'var(--prime-page-bg)' }}. Children sit inside it, including the toaster."),
		H2("9. Theme picker"),
		P(
			"A Fluent Menu of MenuItemRadio, one group headed Theme. checkedValues is { theme: [theme.id] }. onCheckedValueChange reads data.checkedItems[0] and calls findTheme. Ignore an unknown id.",
		),
		Li("Each row: a 32 by 24 swatch (page fill, a 6px bar across the top, a card block inset from the left, right, and bottom) plus the name and description."),
		Li("The trigger is a subtle icon button on the app bar. Its accessible name is Theme: {name}."),
		Li("Put the picker in the actions cluster of the app bar (section 10). The cluster, not the trigger class, restyles .fui-Button to follow the bar."),
	]),
	PageShell([
		H2("10. App bar and page"),
		P(
			"Every PRIME web app uses the same app bar. The reference is Polyline to Polygon: white mark, a hairline rule, then the product name at regular weight, with a 3px orange underline on the bar. Do not invent a second header.",
		),
		H3("Bar"),
		Li("Flex row, wrap, space-between, align center, gap 12px, padding 10px 24px."),
		Li("Background var(--prime-header-bg), color var(--prime-header-fg). Hover of bar items uses var(--prime-header-hover)."),
		Li("Underline is boxShadow: inset 0 -3px 0 #f15d2a. Keep that 3px brand orange on every theme, including when the bar itself is indigo. Do not use Fluent shadow tokens for this line."),
		H3("Brand cluster (left)"),
		Li("Flex row, align center, gap 14px."),
		Li("White PRIME AE wordmark PNG (/prime-ae-logo-white.png). Height 32px, width auto, display block. alt=\"PRIME AE\". Width/height attributes about 96 by 32."),
		Li("Then a decorative rule: a span, aria-hidden, width 1px, align-self stretch, margin 4px 0, background rgba(255,255,255,0.45). Do not use a border on the product name; the rule is its own element so it can stretch to the bar padding."),
		Li("Then the product name: a p, margin 0, fontWeightRegular, fontSizeBase400, lineHeightBase400, color var(--prime-header-fg). Sentence case of the product, not the word PRIME AE again, not bold, not uppercase, no extra letter-spacing. The mark is the brand; the name is the product."),
		H3("Actions cluster (right)"),
		Li("Flex row, wrap, align center, gap 4px. Contains nav links then the theme picker (and a user menu if the app has one)."),
		Li("On this cluster only, restyle .fui-Button so controls follow the bar: color and --colorNeutralForeground2 / Hover / Pressed to var(--prime-header-fg); --colorSubtleBackgroundHover and --colorTransparentBackgroundHover to var(--prime-header-hover); the pressed pair to var(--prime-header-pressed); --colorStrokeFocus2 to var(--prime-header-fg). Set the variables. A color on the host outranks the button's own disabled color."),
		Li("Nav links: padding 6px 12px, fontSizeBase300, fontWeightSemibold, color header fg, no underline, radius medium. Hover: var(--prime-header-hover)."),
		Li("The current route uses the CTA variables: background var(--prime-cta-bg), color var(--prime-cta-fg). Its hover is var(--prime-cta-bg-hover). Inactive nav has no fill."),
		H3("Page"),
		Li("Page chrome (the shell behind cards) uses var(--prime-page-bg) and var(--prime-page-fg). Page subtitles use var(--prime-page-fg-muted)."),
		Li("Provide useOnPageStyles(): text = --prime-page-fg, muted = --prime-page-fg-muted, and a field patch that sets .fui-Field__label to page fg and .fui-Field__hint to page muted. Use that only for fields drawn on the page, not inside a card."),
	]),
	PageShell([
		H2("11. Controls"),
		Li("Button appearance primary for the main action, secondary for the alternate, subtle for a low-emphasis action such as Remove, outline for a paused or token chip. size small for row actions."),
		Li("Forms use Field with label, hint, and validationMessage. Inputs and text areas are Fluent Input and Textarea. Their onChange is (event, data) => data.value."),
		Li("Groups of checkboxes are a fieldset with a legend, not one Field wrapped around several checkboxes. A Field label attaches to the first control."),
		Li("Validation text on a card uses tokens.colorPaletteRedForeground1. Fluent's default danger text is too dark on navy cards."),
		Li("Card borders that must read in every theme: 1px solid tokens.colorNeutralStroke2."),
		Li("Dialogs are Fluent Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent."),
		Li("Do not theme a third-party surface (a PDF letter, an email preview) with the shell. A document preview stays white."),
		H3("Fixed marker, not a surface"),
		P(
			"An alpha or pre-release pill is always background #ffc63e and text #231b4b. It means alpha. It does not follow the theme.",
		),
	]),
	PageShell([
		H2("12. Loading screen"),
		P(
			"Fluent styles are injected at runtime. Server HTML has no Griffel classes, so the brand mark and layout paint at native size until hydration. The person must never see that first paint. Cover it with a brand splash that is in the HTML and whose CSS is inline in the document head, not a linked stylesheet.",
		),
		H3("Look"),
		P(
			"The splash is not a theme. It does not follow PRIME Light, Paper, or Classic Dark. It is always navy #231b4b with white type, even when the stored theme is Paper.",
		),
		Li("Full viewport, position fixed, inset 0, z-index 2147483646, flex column, centered, gap 14px."),
		Li("White PRIME AE wordmark, height 36px, width auto. Decorative: alt text empty."),
		Li("Product name under the mark: the app name in uppercase, 12px, weight 600, letter-spacing 0.16em, system-ui, color #ffffff. Example: PRIME PULSE."),
		Li("No spinner, no orange bar, no progress copy, no skeleton of the real shell."),
		H3("Markup and CSS"),
		Li("Element id is exactly prime-splash. role=status, aria-live=polite, aria-label=Loading {product name}."),
		Li("Place it as the first child of body, before PrimeThemeProvider, so it covers the unstyled app underneath."),
		Li("Put the CSS in a <style> tag in <head>. Linked CSS arrives too late and the broken layout would flash."),
		Li("html and body background #231b4b while the splash is up."),
		Li("Hide with html[data-prime-ready] #prime-splash { display: none }. Instant, not a fade. A fade would show the unstyled tree if Fluent is still injecting."),
		Li("Backup rule, also inline: img[alt=\"PRIME AE\"] { height: 32px; width: auto; display: block }. The header mark must never fill the viewport even if the splash fails."),
		Li("The header <img> also has width and height attributes (about 96 by 32). CSS width auto still wins after Fluent loads."),
		H3("When to reveal"),
		Li("First React render stays PRIME Light and hydrated=false. The splash stays up."),
		Li("In useEffect, read omp:theme (or the OS default), set the theme, then set hydrated true. Do not read storage during render."),
		Li("After that paint, reveal with two requestAnimationFrame ticks so Griffel has flushed. Set document.documentElement.dataset.primeReady = \"true\"."),
		Li("Also start a 2 second timeout that reveals anyway, so a failed theme load cannot trap the person on the splash."),
		Li("Do not reveal on the first PRIME Light paint if a stored theme is about to replace it. Batch the stored theme and hydrated=true in the same effect so the splash still covers the swap."),
		H3("What not to do"),
		Li("Do not theme the splash with --prime-page-bg. Paper is light grey; a white logo would disappear."),
		Li("Do not wait for data (templates, ADP, queries). The splash covers style, not content. \"Checking templates...\" on the real page is fine."),
		Li("Do not skip SSR of the app and show only the splash. Keep the same HTML on server and client; the overlay hides it."),
		Li("Do not use Tailwind, a portal, or a Fluent Spinner for this. The overlay must exist before JavaScript runs."),
	]),
	PageShell([
		H2("13. Optional roaming"),
		P(
			"Skip this unless the app already signs the user in with MSAL. The browser copy is enough. Roaming is best-effort and must never block the picker.",
		),
		Li("Extension name: com.primeeng.themePreference. Property: themeId. Same name as the CMS app."),
		Li("Read with a silent User.Read token. Write with a silent User.ReadWrite token. Never prompt for consent because of a theme."),
		Li("404 on read means the person has never picked a theme. On write, PATCH and POST only when the patch is 404."),
		Li("Swallow every failure. localStorage already holds the choice on this machine."),
		H2("14. What not to do"),
		Li("Do not ship a light theme whose page is white and whose bar is indigo unless it is Paper. PRIME Light is a navy page with white cards and an orange bar."),
		Li("Do not recolor Fluent primary buttons to orange. Orange is the shell CTA."),
		Li("Do not apply navyNeutrals to Classic Dark, Paper, PRIME Light, or Indigo."),
		Li("Do not put orange on Classic Dark."),
		Li("Do not read the stored theme during the first render."),
		Li("Do not rename ids, the storage key, or the Graph extension name."),
		Li("Do not set a document-wide link color."),
		Li("Do not leave Tailwind in the build after the screens stop using it."),
		Li("Do not ship the first paint without the loading screen in section 12."),
		Li("Do not theme the loading screen, fade it out over unstyled HTML, or wait on API data before revealing."),
		Li("Do not invent a second app bar. Do not bold or uppercase the product name, skip the hairline rule, or size the mark anything other than 32px tall."),
		H2("15. Adoption checklist"),
		Li("Add the three packages in section 1. Remove Tailwind and shadcn if they are present."),
		Li("Add src/theme/primeThemes.ts with the ramp, recipes, five themes, findTheme, systemDefaultTheme, and THEME_STORAGE_KEY = omp:theme."),
		Li("Add themeContext, useTheme, onPage, and PrimeThemeProvider as specified in section 8."),
		Li("Wrap the root in PrimeThemeProvider. Put the toaster inside it. Put #prime-splash first in the body and its CSS inline in the head (section 12)."),
		Li("Paint the app bar from section 10: 32px white mark, 1px rule, regular-weight product name, 3px #f15d2a underline, theme picker on the right."),
		Li("Rebuild screens with Fluent controls. Cards use tokens. Page text uses shell variables."),
		Li("Verify all five themes: bar color, page color, card color, CTA color, and that text on the page stays readable. Classic Dark must show no orange except the 3px underline. PRIME Dark cards are navy, not grey."),
		Li("Hard-reload and confirm the navy splash covers the first paint. The header mark must never fill the viewport. Reveal happens after the stored theme is on, within two seconds."),
		H2("16. Module shape"),
		P("The theme module exports exactly these names:"),
		Mono("PRIME_INDIGO, THEME_STORAGE_KEY, PRIME_COLORS, ShellVars,"),
		Mono("PrimeTheme, PRIME_LIGHT, PRIME_DARK, CLASSIC_DARK, PAPER, INDIGO,"),
		Mono("PRIME_THEMES, findTheme, systemDefaultTheme"),
		P(
			"ShellVars and PrimeTheme are types. PRIME_THEMES is a readonly array in picker order. Everything else an app needs (header layout, product name, routes) is that app's own shell and must still use these variables.",
		),
		Note([
			P(
				"Source of truth for the theme values: the primeThemes module shared by Project Portal, Prime Pulse, and Polyline to Polygon, kept aligned with the CMS PrimeThemes ids. Source of truth for the app bar layout: Polyline to Polygon's header (white mark, hairline, product name). If a value here and those modules ever disagree, the modules win and this document should be regenerated.",
			),
		]),
	]),
);

await renderToFile(doc, join(process.cwd(), "docs", "PRIME-AE-Theme-Guidelines.pdf"));
console.log("wrote docs/PRIME-AE-Theme-Guidelines.pdf");
