# HTML Music

A small music-sharing site prototype built with Next.js, Tailwind, and an intentionally plain HTML/CSS/JS surface.

## Run

```bash
npm run dev
```

Then open http://localhost:3000.

## Current shape

- Main river with variable-size song cards.
- Artist pages at `/artists/[slug]`.
- Group/room pages at `/groups/[slug]`.
- Native `audio` controls plus a small range/waveform strip.
- Media Session metadata is set on playback for mobile/lock-screen surfaces where the browser supports it.
- Static seed data lives in `src/lib/music-data.ts`.

## Dev mode

Set `NEXT_PUBLIC_ENABLE_DEV_OUTLINES=true` and restart `npm run dev`. Press `B` to toggle color-coded outlines around page elements. Set it to `false` or leave it unset in production.

## Backend target

See `docs/backend-shape.md` for the planned Cloudflare R2 and D1 schema.

## Style target

See `docs/browser-style.md` for the locked browser-default-inspired style contract.
