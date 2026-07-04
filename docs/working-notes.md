# Working Notes

## Styling Choices

- Links: use inherited black text by default. No underline until hover or keyboard focus. Do not use a separate visited-link purple.
- Site title: `HTML Music` is clickable and uses `cursor: pointer`, but it does not underline on hover.
- Framed sections: use native `fieldset` with `legend` for titled boxes. This gives the text-in-border browser feeling without extra decoration.
- Tables: use real HTML `table` elements for account details, metadata, and other structured key/value information.
- Forms: inputs and buttons should have explicit 1px black borders, white backgrounds, and small padding so they stay visible across browsers.
- Buttons: enabled buttons use `cursor: pointer`; disabled buttons use the default cursor.
- Favicon: use a single Unicode music glyph. No border, extra marks, or illustration.
- Sketch work: use `/sketch` for rough component development before moving pieces into the real feed, groups, upload, or account pages.
- Minimalism: add one component at a time. Avoid decorative backgrounds, tags, waveforms, or extra layout systems until they are needed.
