# Landing photographs and responsive layout

Updated from main at `7756ee5` (merge of PR #7) before editing. Work continues on the existing Phuong branch.

## Changes

- The four “How it works” pictures use the owner's images in order: terraced fields, agricultural drone, crop-rotation diagram, vegetable harvest. All four PNGs are byte-for-byte copies of the attachments. Next.js serves optimized responsive versions. They replace the four generated illustrations on this page.
- Larger cards use 4:3 picture frames, 20 px card titles and 15 px body copy. Four columns at desktop widths, two at tablet widths and one on mobile. The portrait diagram uses contain fitting so the title, arrows and bottom examples stay visible. The other images use deliberate cover framing. The first picture keeps its supplied watermark at the left.
- Each photo opens a full-image dialog, including on mobile, with an accessible name, a close button and Escape support. Images are never retouched or generated in this change.
- The landing layout grows from a 1240 px shell to 1520 px with responsive edge padding. The globe uses a larger desktop frame and a smaller inset; its rendered diameter is about 492 px on a 1366 px laptop, while the call-to-action buttons still fit within the first 768 px of screen height. Canvas rendering has a fixed 512 px raster budget. Rotation, pause, offscreen suspension and reduced-motion behavior remain in place.
- Static gradients use bright greens/cyan/blue/lavender/warm highlights on dark backgrounds and darker colors on light backgrounds. Added faint orbital tracks and atmospheric glows. Hover motion respects reduced-motion settings; gradients have solid-text, forced-color and print fallbacks.
- Photo credits now distinguish NASA background images from supplied step images. The app does not claim the drone supplies its NASA observations.

## Copy boundary

No existing slogans or marketing headings were rewritten: the hero eyebrow, main title, globe caption and final call-to-action remain exactly as before. New slogan candidates are proposals in the chat only. They must be approved before a future implementation.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed, including TypeScript; Windows worker settings CIRCLE_NODE_TOTAL=2 and UV_THREADPOOL_SIZE=1.
- Original/asset SHA-256 checks: all four matched.
- Production server checked at 1920×1080, 1366×768, 390×844 and 320×740. Document width equalled scroll width: 1905, 1351, 375 and 305 px respectively, with scrollbar space excluded.
- Four images loaded in the correct order. Desktop frames measured 312×234 px. Portrait diagram and dialog inspected on desktop and mobile; Escape and the close button worked. English and Vietnamese views checked. Browser error log was empty.
- At 1366×768, the main buttons' bottom edge was at about 664 px, inside the first screen. Slogan preservation checked directly against the previous commit.

This change affects presentation and supplied assets. No scientific model, data adapter or simulation setting was changed.
