# LessonBend

LessonBend bends one learning goal into distinct, anonymous support routes. It is built for teachers who need the lesson to adapt—not the learner to be labelled. The public site is a playable gallery of validated lessons; it stores no learner identities.

## Live demo

Open **[app.lessonbend.com](https://app.lessonbend.com)**. Browse example lessons freely on the homepage, or select **Log in as teacher** to use the full live studio.

```text
Username: teacher
Password: lessonbend-demo
```

## How Codex and GPT-5.6 were used

- **Codex CLI** generated the application and the constrained lesson-module workflow.
- **GPT-5.6** is the pedagogy engine: it decomposes a teacher lesson into a structured specification, evaluates generated lesson quality, and researches anonymous learner-profile suggestions.

The trusted app shell, not the model, renders interactions, handles feedback and accessibility, and enforces the sandbox and network restrictions.

## Architecture, briefly

The local engine uses two model roles: one creates a structured lesson specification; another authors a constrained lesson module. A trusted shell—not the model—owns sandboxing, interaction rendering, accessibility, feedback, progress, and audio playback. Each module is statically checked, browser-rendered without outbound network access, screenshot-validated, and judged before it can enter the gallery.

The public landing is a fast, playable gallery of validated artifact HTML and embedded audio. Its **Log in as teacher (demo)** gate opens the live studio; it is deliberately a presentation gate, not real authentication.

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

## Deploy the live demo on Render

Render is the supported host for the full demo because the application needs a persistent Node process, SQLite, Playwright Chromium, and a writable location for validation screenshots. The repository includes a pinned Playwright Docker image, `render.yaml`, and a persistent `/data` layout.

1. In Render, select **New → Web Service**, connect GitHub, and choose `imgero/lessonbend` on the `main` branch.
2. Select **Docker** as the runtime. Render will use the repository `Dockerfile`; do not enter a separate build or start command.
3. Choose a paid instance type (persistent disks are not available on Free), then open **Advanced** and add a 1 GB disk mounted at `/data`.
4. Add these environment variables in the service's **Environment** page:

   ```text
   OPENAI_API_KEY=<your key>             # secret
   LESSONBEND_DATA_DIR=/data
   OPENAI_TTS_MODEL=gpt-4o-mini-tts      # optional; this is the default
   ```

   Do **not** set `NEXT_PUBLIC_OPENAI_API_KEY`; the browser never receives the key. `PROFILE_PREP_MODEL` is optional and defaults in the app.
5. Set health check path to `/`, create the service, and wait for the first deploy to reach **Live**. Render supplies the `PORT`; the Docker command binds Next.js to it on `0.0.0.0`.
6. In **Settings → Custom Domains**, add `app.lessonbend.com`. Copy the exact hostname Render shows, then add the corresponding CNAME at the domain's DNS provider. Use `app` rather than the apex domain unless the DNS provider supports ANAME/ALIAS records. Render provisions HTTPS after DNS verifies.

The public gallery is still the first screen at the Render URL. Judges can select **Log in as teacher (demo)** to unlock live generation, profile prep, and insights. This demo gate is intentionally not authentication; it is suitable only for a judged prototype.

The disk stores `lessonbend.db` and artifact screenshots under `/data`. A disk-backed service runs as one instance and briefly goes offline during redeploys, which is the appropriate trade-off for this single-instance demo.

To refresh the gallery locally after validating new artifacts:

```bash
node scripts/export-static-gallery.mjs
npm run build
```

SQLite is suitable for this local pilot but not for persistent serverless writes. If live generation is enabled in production later, move run/profile storage and artifact/audio persistence to managed storage first.

## Experimental local feature: Profile Prep

Profile Prep lets a teacher enter an anonymous observation and receive suggested supports, constraints, lesson mix, and source links. The brief is processed once and is never saved; only a teacher-approved anonymous profile may be saved locally. This feature is experimental and local-only for the pilot. It is not included in the public gallery build.

To try it locally, open **Learner profiles**, choose **+ Add profile**, use a fruit-like name such as Banana, add an anonymous observation, and select **Research & suggest**. The proposal’s supports, constraints, lesson mix, and reference links remain editable before saving. A valid `OPENAI_API_KEY` with available API quota is required for this local research call.
