import {
    createDarkTheme,
    createLightTheme,
    type BrandVariants,
    type Theme,
} from "@fluentui/react-components";

/**
 * PRIME AE theme catalog, shared in shape and in ids with the CMS app's
 * `Models/PrimeThemes.cs` so a user's choice reads the same in both products.
 *
 * Two independent axes, as in the brandbook layout:
 *   - Fluent's own light/dark ramp (`isDark`), which drives cards, inputs and menus.
 *   - The PRIME shell (`shell`), which is the app bar and the page the cards sit on.
 * "Classic Dark" and "PRIME Dark" are both Fluent-dark; they differ only in whether the
 * neutral ramp is re-tinted navy.
 */

/** Brandbook indigo (PANTONE 2756 C), pinned exactly at step 80. */
export const PRIME_INDIGO = "#24338a";

/** Browser-local copy of the chosen theme. */
export const THEME_STORAGE_KEY = "omp:theme";

/**
 * Indigo ramp generated from {@link PRIME_INDIGO} by lightness. Step 80 is the brandbook
 * indigo itself, which is what makes `colorBrandBackground` the real brand colour in the
 * light themes rather than the nearest step of a generated ramp.
 */
const primeBrand: BrandVariants = {
    10: "#040610",
    20: "#080c20",
    30: "#0d1231",
    40: "#111841",
    50: "#151e51",
    60: "#192461",
    70: "#1e2b76",
    80: "#24338a",
    90: "#2a3ca2",
    100: "#3045ba",
    110: "#4056ce",
    120: "#5d6fd5",
    130: "#7988dd",
    140: "#9aa5e5",
    150: "#bac2ed",
    160: "#dadff6",
};

/** Raw brandbook colours, for the shell and for the places that need a literal. */
export const PRIME_COLORS = {
    orange: "#f15d2a",
    orangeDeep: "#ce451d",
    orangeDeeper: "#b03a17",
    indigo: PRIME_INDIGO,
    indigoLight: "#5462ad",
    navy: "#231b4b",
    grey100: "#f1f3f7",
    grey300: "#cecedc",
} as const;

/**
 * The PRIME shell: the app bar, the page behind the cards, and the one orange call to
 * action. These are emitted as CSS custom properties on the app root, because they are
 * not Fluent tokens - Fluent owns the card, the shell does not.
 */
export type ShellVars = {
    "--prime-header-bg": string;
    "--prime-header-fg": string;
    "--prime-header-hover": string;
    "--prime-header-pressed": string;
    "--prime-page-bg": string;
    "--prime-page-fg": string;
    "--prime-page-fg-muted": string;
    "--prime-page-fg-disabled": string;
    "--prime-page-hover": string;
    "--prime-page-pressed": string;
    "--prime-page-stroke": string;
    "--prime-cta-bg": string;
    "--prime-cta-bg-hover": string;
    "--prime-cta-bg-pressed": string;
    "--prime-cta-fg": string;
};

/** Page-level controls drawn on a dark page (navy or indigo): light text on the page. */
const onDarkPage = {
    "--prime-page-fg": "#ffffff",
    "--prime-page-fg-muted": "rgba(255, 255, 255, 0.74)",
    "--prime-page-fg-disabled": "rgba(255, 255, 255, 0.42)",
    "--prime-page-hover": "rgba(255, 255, 255, 0.10)",
    "--prime-page-pressed": "rgba(255, 255, 255, 0.18)",
    "--prime-page-stroke": "rgba(255, 255, 255, 0.55)",
} as const;

/** The same set for a light page, where the page text has to go navy instead. */
const onLightPage = {
    "--prime-page-fg": PRIME_COLORS.navy,
    "--prime-page-fg-muted": "rgba(35, 27, 75, 0.72)",
    "--prime-page-fg-disabled": "rgba(35, 27, 75, 0.42)",
    "--prime-page-hover": "rgba(35, 27, 75, 0.06)",
    "--prime-page-pressed": "rgba(35, 27, 75, 0.12)",
    "--prime-page-stroke": "rgba(35, 27, 75, 0.38)",
} as const;

/** The orange app bar, as on the PRIME Hub SharePoint site. */
const orangeBar = {
    "--prime-header-bg": PRIME_COLORS.orangeDeep,
    "--prime-header-fg": "#ffffff",
    "--prime-header-hover": "rgba(255, 255, 255, 0.14)",
    "--prime-header-pressed": "rgba(255, 255, 255, 0.22)",
} as const;

const indigoBar = {
    ...orangeBar,
    "--prime-header-bg": PRIME_COLORS.indigo,
} as const;

/** #ce451d fill with white text: 4.67:1, the one pairing allowed for small text. */
const orangeCta = {
    "--prime-cta-bg": PRIME_COLORS.orangeDeep,
    "--prime-cta-bg-hover": PRIME_COLORS.orangeDeeper,
    "--prime-cta-bg-pressed": "#8f2e11",
    "--prime-cta-fg": "#ffffff",
} as const;

/**
 * Fluent generates a grey neutral ramp for dark mode. The PRIME dark themes want navy
 * cards, so each neutral is re-issued at the same lightness in the brand navy hue. Keep
 * the lightness steps if the hue is ever retuned.
 *
 * Classic Dark deliberately opts out of this block - keeping Fluent's own greys is the
 * entire point of that theme.
 */
const navyNeutrals: Partial<Theme> = {
    colorNeutralBackground1: "#2e245f",
    colorNeutralBackground1Hover: "#3a2d78",
    colorNeutralBackground1Pressed: "#281f53",
    colorNeutralBackground1Selected: "#372b71",
    colorNeutralBackground2: "#281f53",
    colorNeutralBackground2Hover: "#34296b",
    colorNeutralBackground2Pressed: "#211a45",
    colorNeutralBackground2Selected: "#312665",
    colorNeutralBackground3: "#211a45",
    colorNeutralBackground3Hover: "#2e245f",
    colorNeutralBackground3Pressed: "#1b1639",
    colorNeutralBackground3Selected: "#2b2259",
    colorNeutralBackground4: "#1b1639",
    colorNeutralBackground4Hover: "#281f53",
    colorNeutralBackground4Pressed: "#15112c",
    colorNeutralBackground4Selected: "#251d4c",
    colorNeutralBackground5: "#15112c",
    colorNeutralBackground5Hover: "#211a45",
    colorNeutralBackground5Pressed: "#181333",
    colorNeutralBackground5Selected: "#1e183f",
    colorNeutralBackground6: "#34296b",
    colorNeutralBackgroundAlpha: "rgba(37, 29, 76, 0.5)",
    colorNeutralBackgroundAlpha2: "rgba(40, 31, 83, 0.7)",
    colorNeutralBackgroundDisabled: "#211a45",
    colorNeutralBackgroundInverted: "#ffffff",
    colorNeutralBackgroundStatic: "#3a2d78",
    colorNeutralCardBackground: "#34296b",
    colorNeutralCardBackgroundDisabled: "#211a45",
    colorNeutralCardBackgroundHover: "#3a2d78",
    colorNeutralCardBackgroundPressed: "#312665",
    colorNeutralCardBackgroundSelected: "#372b71",
    colorNeutralForeground1: "#ffffff",
    colorNeutralForeground1Hover: "#ffffff",
    colorNeutralForeground1Pressed: "#ffffff",
    colorNeutralForeground1Selected: "#ffffff",
    colorNeutralForeground1Static: "#2b2259",
    colorNeutralForeground2: "#d2cfdd",
    colorNeutralForeground2Hover: "#ffffff",
    colorNeutralForeground2Link: "#d2cfdd",
    colorNeutralForeground2LinkHover: "#ffffff",
    colorNeutralForeground2LinkPressed: "#ffffff",
    colorNeutralForeground2LinkSelected: "#ffffff",
    colorNeutralForeground2Pressed: "#ffffff",
    colorNeutralForeground2Selected: "#ffffff",
    colorNeutralForeground3: "#a4a0ba",
    colorNeutralForeground3Hover: "#d2cfdd",
    colorNeutralForeground3Pressed: "#d2cfdd",
    colorNeutralForeground3Selected: "#d2cfdd",
    colorNeutralForeground4: "#8e89a9",
    colorNeutralForegroundDisabled: "#6a5fa8",
    colorNeutralForegroundInverted: "#2b2259",
    colorNeutralForegroundInverted2: "#2b2259",
    colorNeutralForegroundInvertedHover: "#2b2259",
    colorNeutralForegroundInvertedLink: "#ffffff",
    colorNeutralForegroundInvertedLinkHover: "#ffffff",
    colorNeutralForegroundInvertedLinkPressed: "#ffffff",
    colorNeutralForegroundInvertedLinkSelected: "#ffffff",
    colorNeutralForegroundInvertedPressed: "#2b2259",
    colorNeutralForegroundInvertedSelected: "#2b2259",
    colorNeutralForegroundOnBrand: "#ffffff",
    colorNeutralForegroundStaticInverted: "#ffffff",
    colorNeutralStencil1: "#50438e",
    colorNeutralStencil2: "#34296b",
    colorNeutralStroke1: "#5e5298",
    colorNeutralStroke1Hover: "#6e64a0",
    colorNeutralStroke1Pressed: "#63579c",
    colorNeutralStroke1Selected: "#685d9f",
    colorNeutralStroke2: "#4b3e8a",
    colorNeutralStroke3: "#3a2d78",
    colorNeutralStrokeAccessible: "#a4a0ba",
    colorNeutralStrokeAccessibleHover: "#b6b2c8",
    colorNeutralStrokeAccessiblePressed: "#aba7bf",
    colorNeutralStrokeDisabled: "#3d307d",
    colorNeutralStrokeOnBrand: "#2e245f",
    colorNeutralStrokeOnBrand2: "#ffffff",
    colorNeutralStrokeOnBrand2Hover: "#ffffff",
    colorNeutralStrokeOnBrand2Pressed: "#ffffff",
    colorNeutralStrokeOnBrand2Selected: "#ffffff",
    colorNeutralStrokeSubtle: "#1b1639",
    colorSubtleBackgroundHover: "#372b71",
    colorSubtleBackgroundLightAlphaHover: "rgba(43, 34, 89, 0.8)",
    colorSubtleBackgroundLightAlphaPressed: "rgba(43, 34, 89, 0.5)",
    colorSubtleBackgroundPressed: "#312665",
    colorSubtleBackgroundSelected: "#34296b",
};

/**
 * Shared by every dark theme: the exact-indigo pin leaves Fluent's dark brand colours at
 * #24338a, which disappears on a dark surface, so they step up the ramp. Depends only on
 * the surface being dark, not on whether it is navy or grey.
 */
const darkBrandLift: Partial<Theme> = {
    colorBrandForeground1: "#a8a5cf",
    colorBrandForeground2: "#b7b4d8",
    colorBrandForeground2Hover: "#d6d4e9",
    colorBrandForegroundLink: "#a8a5cf",
    colorBrandForegroundLinkHover: "#d6d4e9",
    colorBrandForegroundLinkPressed: "#8a87be",
    colorBrandForegroundLinkSelected: "#a8a5cf",
    colorBrandBackground: PRIME_COLORS.indigoLight,
    colorBrandBackgroundHover: "#6470bd",
    colorBrandBackgroundPressed: "#4a57a3",
    colorBrandBackgroundSelected: "#4a57a3",
    colorBrandBackground2: "#3d3486",
    colorBrandBackground2Hover: "#473d95",
    colorBrandBackground2Pressed: "#332c70",
    colorBrandStroke1: "#8a87be",
    colorBrandStroke2: "#4a57a3",
    colorNeutralForeground2BrandHover: "#b7b4d8",
    colorNeutralForeground2BrandPressed: "#a8a5cf",
    colorNeutralForeground2BrandSelected: "#b7b4d8",
    colorNeutralStrokeAccessibleSelected: "#8a87be",
};

/** The indigo is already exactly brand[80]; only the hover/pressed steps need pinning. */
const lightBrandPin: Partial<Theme> = {
    colorBrandBackground: PRIME_INDIGO,
    colorBrandBackgroundHover: "#1e2b76",
    colorBrandBackgroundPressed: "#192461",
    colorBrandBackgroundSelected: "#1e2b76",
};

const lightBase = createLightTheme(primeBrand);
const darkBase = createDarkTheme(primeBrand);

/** One entry in the theme picker. */
export type PrimeTheme = {
    id: string;
    name: string;
    description: string;
    isDark: boolean;
    /** Preview stripe in the picker: app bar / page / card. Literals, so a row shows its own theme. */
    swatch: { bar: string; page: string; card: string };
    theme: Theme;
    shell: ShellVars;
};

export const PRIME_LIGHT: PrimeTheme = {
    id: "prime-light",
    name: "PRIME Light",
    description: "Navy page, white cards",
    isDark: false,
    swatch: { bar: PRIME_COLORS.orangeDeep, page: PRIME_COLORS.navy, card: "#ffffff" },
    theme: { ...lightBase, ...lightBrandPin },
    shell: { ...orangeBar, ...onDarkPage, ...orangeCta, "--prime-page-bg": PRIME_COLORS.navy },
};

export const PRIME_DARK: PrimeTheme = {
    id: "prime-dark",
    name: "PRIME Dark",
    description: "Navy page and cards",
    isDark: true,
    swatch: { bar: PRIME_COLORS.orangeDeep, page: PRIME_COLORS.navy, card: "#2e245f" },
    theme: { ...darkBase, ...darkBrandLift, ...navyNeutrals },
    shell: { ...orangeBar, ...onDarkPage, ...orangeCta, "--prime-page-bg": PRIME_COLORS.navy },
};

/**
 * A plain dark shell: Fluent's own greys, and no orange anywhere - PRIME orange on neutral
 * grey is the one pairing the brandbook layout was never meant to produce. The bar and the
 * CTA take two different steps of the indigo ramp on purpose, so the CTA still reads as the
 * single brightest fill on screen.
 */
export const CLASSIC_DARK: PrimeTheme = {
    id: "classic-dark",
    name: "Classic Dark",
    description: "Neutral grey, indigo accents",
    isDark: true,
    swatch: { bar: PRIME_INDIGO, page: "#1f1f1f", card: "#292929" },
    theme: {
        ...darkBase,
        ...darkBrandLift,
        colorBrandBackground: "#3d3486",
        colorBrandBackgroundHover: "#473d95",
        colorBrandBackgroundPressed: "#332c70",
        colorBrandBackgroundSelected: "#473d95",
    },
    shell: {
        ...indigoBar,
        ...onDarkPage,
        "--prime-page-bg": "#1f1f1f",
        "--prime-cta-bg": PRIME_COLORS.indigoLight,
        "--prime-cta-bg-hover": "#6470bd",
        "--prime-cta-bg-pressed": "#4a57a3",
        "--prime-cta-fg": "#ffffff",
    },
};

/** Indigo bar, but the CTA keeps its orange: there is no brightness juggling to do here. */
export const PAPER: PrimeTheme = {
    id: "paper",
    name: "Paper",
    description: "Light grey page, indigo bar",
    isDark: false,
    swatch: { bar: PRIME_INDIGO, page: PRIME_COLORS.grey100, card: "#ffffff" },
    theme: { ...lightBase, ...lightBrandPin },
    shell: { ...indigoBar, ...onLightPage, ...orangeCta, "--prime-page-bg": PRIME_COLORS.grey100 },
};

/**
 * The one theme whose page is the brand colour itself, which means a brand-filled surface
 * would otherwise be invisible on it. The brand fill steps up the ramp here so it sits
 * above the page; the hairline on those cards (see ButtonCard) does the rest, because two
 * steps of one hue can never reach 3:1 on their own.
 */
export const INDIGO: PrimeTheme = {
    id: "indigo",
    name: "Indigo",
    description: "Brand indigo page, white cards",
    isDark: false,
    swatch: { bar: PRIME_COLORS.orangeDeep, page: PRIME_INDIGO, card: "#ffffff" },
    theme: {
        ...lightBase,
        ...lightBrandPin,
        colorBrandBackground: "#3045ba",
        colorBrandBackgroundHover: "#4056ce",
        colorBrandBackgroundPressed: "#2a3ca2",
        colorBrandBackgroundSelected: "#4056ce",
    },
    shell: { ...orangeBar, ...onDarkPage, ...orangeCta, "--prime-page-bg": PRIME_INDIGO },
};

export const PRIME_THEMES: readonly PrimeTheme[] = [
    PRIME_LIGHT,
    PRIME_DARK,
    CLASSIC_DARK,
    PAPER,
    INDIGO,
];

export function findTheme(id: string | null | undefined): PrimeTheme | undefined {
    return id ? PRIME_THEMES.find(t => t.id === id) : undefined;
}

/** What an unseen user gets: the brandbook pair, following the OS. */
export function systemDefaultTheme(prefersDark: boolean): PrimeTheme {
    return prefersDark ? PRIME_DARK : PRIME_LIGHT;
}
