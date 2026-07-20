import type { LessonModule } from "@/lib/contracts";
import { renderTrustedArtifact } from "@/lib/trusted-shell-v2";

export const SHELL_V3 = "trusted-shell-v18";

export function renderTrustedArtifactV3(module: LessonModule) {
  const compactResponsiveCss = `<style>body{height:auto!important;min-height:100vh!important;overflow:auto!important}main{height:auto!important;min-height:100vh!important;padding:18px!important}.card{height:auto!important;min-height:calc(100vh - 36px)!important;max-height:none!important;overflow:visible!important}h1{font-size:clamp(1.4rem,3vw,2.35rem)!important}.stage{overflow:visible!important}.model{width:min(210px,28vh)!important;height:min(210px,28vh)!important}@media(min-width:900px){.card{width:min(1050px,100%)!important}.worked{max-width:920px;margin-inline:auto}}</style>`;
  const workedStrategy = `<section class="worked" style="border:2px solid var(--accent);background:var(--soft);padding:14px;border-radius:18px;margin-top:12px"><b>Worked strategy</b><p>Read the question. Find the sentence with the clue word. Then choose the answer that matches that sentence.</p></section>`;
  return renderTrustedArtifact(module).replace("trusted-shell-v17", SHELL_V3).replace(/<section style="border:2px solid var\(--accent\);[\s\S]*?<\/section>/, workedStrategy).replace("</head>", `${compactResponsiveCss}</head>`);
}
