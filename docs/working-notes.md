# Working Notes

## Styling Choices

- Links: use inherited black text by default. No underline until hover or keyboard focus. Do not use a separate visited-link purple.
- Header active state: the link for the current page uses `aria-current="page"` and bold text.
- Coming-soon nav: keep top-level links visually normal when the section exists, and let the destination page say the simple empty-state copy, like `no groups yet`.
- Header dev mode: every structural header element has a named `data-dev-outline` value with its own outline color.
- Site title: `HTML Music` is clickable and uses `cursor: pointer`, but it does not underline on hover. The word `Music` can be rendered as a larger image asset below `HTML` while preserving the accessible text.
- Header image assets: tiny local retro assets can use plain `img` tags instead of `next/image` so the browser loads the exact source file.
- Layout gutters: use Tailwind spacing utilities for shared page/header gutters. Current side gutter is `px-4`.
- Header typography: use Tailwind text utilities for title sizing. Current `HTML` word size comes from `text-3xl`.
- Loading states: use plain `...` for passive waiting states instead of explanatory loading copy.
- Framed sections: use native `fieldset` with `legend` for titled boxes. This gives the text-in-border browser feeling without extra decoration.
- Tables: use real HTML `table` elements for account details, metadata, and other structured key/value information.
- Forms: inputs and buttons should have explicit 1px black borders, white backgrounds, and small padding so they stay visible across browsers.
- Buttons: enabled buttons use `cursor: pointer`; disabled buttons use the default cursor.
- Favicon: use the single `19-53.png` music mark as a white transparent PNG. No border, extra marks, or illustration.
- Main stream: call it the `river`, not the feed. It should feel discovered and time-based rather than algorithmic.
- Sketch work: use `/sketch` for rough component development before moving pieces into the real river, groups, upload, or account pages.
- Minimalism: add one component at a time. Avoid decorative backgrounds, tags, waveforms, or extra layout systems until they are needed.
