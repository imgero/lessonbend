# LessonBend

LessonBend turns one learning goal into distinct, anonymous support routes. The public build is a static, playable gallery; live generation and profile preparation remain local-only during the pilot.

## Run the local engine

1. Copy `.env.example` to `.env.local` and add `OPENAI_API_KEY`.
2. Run `npm install` and `npm run dev`.
3. Open `http://localhost:3000`.

The local engine uses SQLite (`lessonbend.db`, ignored by Git), validates generated modules in a sandboxed browser, and can make model/TTS calls. Do not use real learner names or identifying details.

## Build the public gallery

The gallery is generated from validated local artifacts and contains no database reads or writes at runtime.

```bash
node scripts/export-static-gallery.mjs
NEXT_PUBLIC_STATIC_GALLERY=true npm run build
```

Deploy the resulting Next build to Vercel with `NEXT_PUBLIC_STATIC_GALLERY=true`. The site presents only baked lesson artifacts. The client does not mount generation or profile-prep controls, so production requires neither an OpenAI key nor a SQLite database.

## Vercel note

SQLite is suitable for the local pilot but not for persistent serverless writes. The static gallery avoids that limitation entirely. If live generation is later enabled in production, move run/profile storage and artifact/audio persistence to managed storage first.
