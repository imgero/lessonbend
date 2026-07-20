import type { LessonModule } from "@/lib/contracts";
import { renderTrustedArtifactV8 } from "@/lib/trusted-shell-v8";

export const SHELL_V9 = "trusted-shell-v27";

/** Layout and interaction polish layered over the v23 trusted shell. */
export function renderTrustedArtifactV9(module: LessonModule, accent?: string | null) {
  const css = `<style>
    body{font-size:17px}main{max-width:1280px;padding:16px}.card{padding:clamp(18px,3vw,30px)}
    .feedback{margin:12px 0;min-height:50px}.feedback.ok,.feedback.no{position:fixed;z-index:5;top:18px;left:50%;width:min(760px,calc(100vw - 32px));transform:translateX(-50%);box-shadow:0 8px 24px #24324a33}.choice,.action,.token{padding:11px 14px;margin:5px}.choice:disabled{opacity:.62;cursor:default}
    .pair-board{gap:22px;max-width:820px}.pair-side{gap:10px;padding:14px}
    @media(min-width:701px){
      .card{grid-template-columns:minmax(280px,.78fr) minmax(440px,1.32fr);gap:18px 24px}
      .card>h1{grid-row:1}.card>.bar{grid-row:2}.card>.level{grid-row:3}
      .card>#intro{grid-column:1;grid-row:4}.card>.audio-btn{grid-column:1;grid-row:5}.card>.worked{grid-column:1;grid-row:6}.card>.passage-player{grid-column:1;grid-row:7}
      .card>#stage{grid-column:2;grid-row:4 / span 4;min-height:300px}
    }
  </style><script>(()=>{const post=MessagePort.prototype.postMessage;MessagePort.prototype.postMessage=function(message,...args){if(message&&(message.type==='lessonbend.checkpoint'||message.type==='lessonbend.complete')){const match=document.querySelector('#level')?.textContent?.match(/Level (\\d+) of (\\d+)/);message={...message,timestamp:Date.now(),stepIndex:match?Number(match[1]):undefined,totalSteps:match?Number(match[2]):undefined}}return post.call(this,message,...args)}})()</script>`;
  return renderTrustedArtifactV8(module, accent)
    .replace(/data-lessonbend-shell="[^"]+"/, `data-lessonbend-shell="${SHELL_V9}"`)
    .replace("</head>", `${css}</head>`);
}
