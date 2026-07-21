# LessonBend

LessonBend bends one learning goal into distinct, anonymous support routes. It is built for teachers who need the lesson to adapt—not the learner to be labelled. The public site is a playable gallery of validated lessons; it stores no learner identities.

## Start here: the live gallery

Open **[lessonbend.com](https://lessonbend.com)** first. It contains the ready-to-play fractions, science, and reading routes, including fullscreen lessons and embedded audio where available.

## Architecture, briefly

The local engine uses two model roles: one creates a structured lesson specification; another authors a constrained lesson module. A trusted shell—not the model—owns sandboxing, interaction rendering, accessibility, feedback, progress, and audio playback. Each module is statically checked, browser-rendered without outbound network access, screenshot-validated, and judged before it can enter the gallery.

The public landing is a fast, playable gallery of validated artifact HTML and embedded audio. Its **Log in as teacher (demo)** gate opens the live studio locally; it is deliberately a presentation gate, not real authentication.

## Run the local engine

1. Copy `.env.example` to `.env.local`.
2. Set `OPENAI_API_KEY` to your own key.
3. Run `npm install`, then `npm run dev`.
4. Open `http://localhost:3000`.

The local engine uses SQLite (`lessonbend.db`, ignored by Git), calls OpenAI for planning, module authoring, evaluation, and optional TTS, and validates artifacts in a sandboxed browser. Do not enter real learner names or identifying details.

## Demo teacher gate

The public landing always remains playable without a login. To open the live teacher studio in the local demo:

```text
Username: teacher
Password: lessonbend-demo
```

This is intentionally not security. It has no user records, sessions, or authentication library, and the credentials are visible in the client bundle. It is suitable only for a judged demo where the API key stays server-side.

## Production / Vercel

The static gallery requires **no environment variables**. Do not set an `OPENAI_API_KEY` for the public gallery unless the backend is moved to durable infrastructure.

There is not yet a safe Vercel-only configuration for the live engine. The current local engine requires:

```bash
OPENAI_API_KEY=...
OPENAI_TTS_MODEL=gpt-4o-mini-tts # optional
```

`OPENAI_API_KEY` must never be named `NEXT_PUBLIC_OPENAI_API_KEY`. The live pipeline currently depends on a writable SQLite database, local screenshots, and Playwright browser validation. Vercel functions have ephemeral filesystems and execution limits, so enabling `OPENAI_API_KEY` alone would not make the live generator reliable. A future production live engine needs managed database/artifact storage and a compatible browser-validation worker.

To refresh the gallery locally after validating new artifacts:

```bash
node scripts/export-static-gallery.mjs
NEXT_PUBLIC_STATIC_GALLERY=true npm run build
```

SQLite is suitable for this local pilot but not for persistent serverless writes. If live generation is enabled in production later, move run/profile storage and artifact/audio persistence to managed storage first.

## Experimental local feature: Profile Prep

Profile Prep lets a teacher enter an anonymous observation and receive suggested supports, constraints, lesson mix, and source links. The brief is processed once and is never saved; only a teacher-approved anonymous profile may be saved locally. This feature is experimental and local-only for the pilot. It is not included in the public gallery build.

To try it locally, open **Learner profiles**, choose **+ Add profile**, use a fruit-like name such as Banana, add an anonymous observation, and select **Research & suggest**. The proposal’s supports, constraints, lesson mix, and reference links remain editable before saving. A valid `OPENAI_API_KEY` with available API quota is required for this local research call.
