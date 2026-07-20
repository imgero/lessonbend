import type { LessonModule } from "@/lib/contracts";
import { renderTrustedArtifactV6 } from "@/lib/trusted-shell-v6";
export const SHELL_V7 = "trusted-shell-v22";
export function renderTrustedArtifactV7(module: LessonModule, accent?: string | null) {
  const sentences = module.intro.match(/[^.!?]+[.!?]+/g) ?? [module.intro];
  const player = module.adaptations.audio ? `<section class="passage-player" style="margin:14px 0;padding:14px;border:2px solid var(--a);border-radius:18px;background:var(--soft)"><b>Listen to the passage</b><p>${module.intro}</p><button class="choice" id="replay-passage">▶ Replay passage</button>${sentences.map((sentence, index) => `<button class="choice sentence-replay" data-sentence="${encodeURIComponent(sentence.trim())}">Replay sentence ${index + 1}</button>`).join("")}</section>` : "";
  const script = module.adaptations.audio ? `<script>document.querySelector('#replay-passage').onclick=()=>speechSynthesis.speak(new SpeechSynthesisUtterance(${JSON.stringify(module.intro)}));document.querySelectorAll('.sentence-replay').forEach(b=>b.onclick=()=>speechSynthesis.speak(new SpeechSynthesisUtterance(decodeURIComponent(b.dataset.sentence))))</script>` : "";
  const accentCss = accent ? `:root{--a:${accent};--soft:color-mix(in srgb,${accent} 17%,#fffdf8)}` : "";
  return renderTrustedArtifactV6(module).replace("trusted-shell-v21", SHELL_V7).replace("</style>", `${accentCss}</style>`).replace("<div class=\"bar\">", `${player}<div class="bar">`).replace("</body>", `${script}</body>`);
}
