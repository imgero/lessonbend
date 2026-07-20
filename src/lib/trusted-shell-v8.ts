import type { LessonModule } from "@/lib/contracts";
import { renderTrustedArtifactV7 } from "@/lib/trusted-shell-v7";
export const SHELL_V8 = "trusted-shell-v23";
export function renderTrustedArtifactV8(module: LessonModule, accent?: string | null) {
  const additions = `<style>.pair-board{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:700px;margin:auto}.pair-side{display:grid;gap:8px;padding:10px;border-radius:18px}.pair-left{background:#fff4cc}.pair-right{background:#eaf0ff}.selected-pair{background:var(--soft)!important;outline:3px solid var(--a)}@media(min-width:701px){.card{display:grid;grid-template-columns:minmax(250px,.9fr) minmax(340px,1.25fr);gap:18px;align-items:start}.card>h1,.card>.bar,.card>.level,.card>.feedback{grid-column:1/-1}.card>#intro,.card>.audio-btn,.card>.worked,.card>.passage-player{grid-column:1}.card>#stage{grid-column:2;grid-row:2/span 5;min-height:390px}}@media(max-width:700px){.pair-board{grid-template-columns:1fr}.pair-left{border:2px solid #e9bc2c}.pair-right{border:2px solid #7794df}}</style><script>document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.sector')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}})</script>`;
  return renderTrustedArtifactV7(module, accent).replace("trusted-shell-v22", SHELL_V8).replace("</head>", `${additions}</head>`);
}
