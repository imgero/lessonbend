import type { LessonModule } from "@/lib/contracts";
import { renderTrustedArtifactV4 } from "@/lib/trusted-shell-v4";
export const SHELL_V5 = "trusted-shell-v20";
export function renderTrustedArtifactV5(module: LessonModule) {
  const sort = `if(s.kind==='bin-sort'){let bin,placed=0,correct=0;stage.innerHTML+='<p class="label">Tap a category, then tap each detail that belongs there.</p><div class="bins">'+(s.bins||[]).map(x=>'<button class="choice" data-bin="'+x+'">'+x+'</button>').join('')+'</div>'+(s.items||[]).map((x,i)=>'<button class="token" data-i="'+i+'">'+x.label+'</button>').join('');stage.querySelectorAll('[data-bin]').forEach(b=>b.onclick=()=>{bin=b.dataset.bin;stage.querySelectorAll('[data-bin]').forEach(x=>x.style.background='');b.style.background='var(--soft)'});stage.querySelectorAll('.token').forEach((b,i)=>b.onclick=()=>{if(!bin)return;const ok=s.items?.[i].bin===bin;b.disabled=true;b.textContent=(ok?'✓ ':'↻ ')+b.textContent;placed++;if(ok)correct++;if(placed===(s.items||[]).length)done(correct===placed,s)});return}`;
  return renderTrustedArtifactV4(module).replace("trusted-shell-v19", SHELL_V5).replace(/if\(s\.kind==='bin-sort'\)\{[\s\S]*?(?=if\(s\.kind==='reveal-pairs'\))/, sort);
}
