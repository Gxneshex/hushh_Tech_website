# Benefits Card Grid Spacing Visual Proof

Surface: `src/pages/benefits/index.tsx` responsive benefits card grid.

Proof captured with Playwright from a local Vite proof page that imports the real `BenefitsPage` component and `src/index.css`. The screenshot is not a manually recreated card grid.

Screenshots:

- `benefits-card-grid-desktop.png` - desktop-width benefits card grid with two-column cards, consistent gaps, and full-width CTA card.
- `benefits-card-grid-mobile.png` - narrow mobile benefits card grid with single-column cards and preserved row spacing.

Recreate:

```bash
node docs/pr-proof/benefits-card-grid-spacing/capture-visual-proof.mjs
```
