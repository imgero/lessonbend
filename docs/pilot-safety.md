# LessonBend pilot safety contract

## Data flow

Teacher lesson text is checked in the browser for obvious identifiers before it can be sent to the generation API. The API receives lesson content and anonymous support profiles only. The pilot does not create student accounts, rosters, names, learner histories, or analytics.

## Artifact boundary

Generated HTML is immutable and is rendered only in a sandboxed iframe with `allow-scripts`. The host sends a random run token over a transferred `MessageChannel` port; the artifact may emit only the Zod-validated events `ready`, `checkpoint`, `complete`, and `error` through that port. It cannot use network requests, storage, popups, navigation, external scripts, or forms. A static policy check rejects these capabilities; the validator will also deny all network requests.

## Pilot limits

The browser warning is deliberately a warning, not a guarantee of anonymisation. Teachers must remove identifying detail. The product is instructional support, not diagnosis, assessment, or treatment. A teacher approves or regenerates each artifact before it is used.

## Feedback rule

Artifacts must not encode correctness in colour alone. Correct feedback combines green, a check icon, explicit text, and a small celebration. Incorrect feedback combines warm amber, a retry icon, explicit text, and a gentle cue toward the next move. Red is not used for ordinary learning retries.
