# Gong

A celebratory web app where people strike a gong, leave a note, and watch the page fill with live celebrations.

## Original Plan

This project started from the following product direction:

1. The homepage should center around a rich gong experience, ideally with a 3D gong and a clean white page.
2. The page should show other visitors' cursors in a Figma-style presence layer.
3. Hitting the gong should open a dialog above it with:
   - `What are you celebrating today?`
   - a name field
   - a submit button
4. Celebration comments should appear as randomly placed blocks on the page.
5. Each celebration should automatically include location by IP and a server-determined date.
6. Older celebrations should fade over time, and only about 40 should remain visible on the page before older ones disappear.
7. A celebration log button should open a full history view showing date, author, and comment.

## Current Direction

The current implementation is focused on getting the visual foundation right first:

- Full-screen 3D gong and torii composition
- Minimal white atmospheric stage
- Camera-tunable scene for composition work
- Celebration overlays and log infrastructure kept in place while the visual system is refined

The next functional step is to connect the ring action back into the celebration submission flow once the scene layout is finalized.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

The app runs locally without external services using a file-based fallback store.

Optional Supabase env vars enable persistent shared data and realtime presence:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional IP geolocation env var:

- `IPINFO_TOKEN`
