import { PRIME_COLORS } from "#/theme/primeThemes";

/** Inline so the overlay paints before Fluent and the linked stylesheet. */
export const SPLASH_CSS = `
html, body {
  height: 100%;
  margin: 0;
  background: ${PRIME_COLORS.navy};
}
#prime-splash {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: ${PRIME_COLORS.navy};
  color: #ffffff;
}
#prime-splash img {
  height: 36px;
  width: auto;
  display: block;
}
#prime-splash p {
  margin: 0;
  font: 600 12px/1 system-ui, sans-serif;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
html[data-prime-ready] #prime-splash {
  display: none;
}
img[alt="PRIME AE"] {
  height: 32px;
  width: auto;
  display: block;
}
`;

export function revealApp() {
	document.documentElement.dataset.primeReady = "true";
}

/** Covers the unstyled SSR until Fluent and the stored theme are on. */
export function PrimeSplash() {
	return (
		<div id="prime-splash" role="status" aria-live="polite" aria-label="Loading Prime Pulse">
			<img src="/prime-ae-logo-white.png" alt="" />
			<p>Prime Pulse</p>
		</div>
	);
}
