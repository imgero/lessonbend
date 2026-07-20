import type { LessonModule } from "@/lib/contracts";
import { renderTrustedArtifactV5 } from "@/lib/trusted-shell-v5";
export const SHELL_V6 = "trusted-shell-v21";
export function renderTrustedArtifactV6(module: LessonModule) {
  const pairs = `if(s.kind==='reveal-pairs'){let first,matched=0,total=(s.pairs||[]).length;stage.innerHTML+='<p class="label">Tap one card, then tap the card that matches it.</p><div class="pairs">'+(s.pairs||[]).flatMap((x,i)=>['<button class="choice" data-k="'+i+'">'+x.left+'</button>','<button class="choice" data-k="'+i+'">'+x.right+'</button>']).join('')+'</div>';stage.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{if(first===undefined){first=b.dataset.k;b.style.background='var(--soft)';return}if(first===b.dataset.k){matched++;b.disabled=true;stage.querySelectorAll('[data-k="'+first+'"]').forEach(x=>x.disabled=true);if(matched===total)done(true,s)}else done(false,s);first=undefined});return}`;
  const vocab = module.adaptations.workedExample ? `<div class="vocab" style="margin-top:10px;padding:10px;border-radius:12px;background:#fff">${module.vocabulary.map(v => `<b>${v.term}</b>: ${v.meaning}`).join(" · ")}</div>` : "";
  return renderTrustedArtifactV5(module).replace("trusted-shell-v20", SHELL_V6).replace(/if\(s\.kind==='reveal-pairs'\)\{[\s\S]*?(?=if\(s\.kind==='label-parts'\))/, pairs).replace("</section><div class=\"bar\">", `${vocab}</section><div class="bar">`).replace("q('#audio').onclick=()=>say(m.audioText||m.intro)", "q('#audio').onclick=()=>say(m.steps[step]?.prompt||m.audioText||m.intro)");
}
