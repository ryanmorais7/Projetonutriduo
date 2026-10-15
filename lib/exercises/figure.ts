// Motor das demonstrações: figura esquemática em SVG (viewBox 120×100, chão em y=92).
// Cada pose define quadril, inclinação do tronco e alvos de mãos/pés; joelhos e cotovelos saem de
// cinemática inversa de dois segmentos. Assim os apoios ficam onde devem (pés no chão, mãos na parede).
export type Pt=[number,number];
export type Limb={to:Pt}|{a:[number,number]}; // alvo absoluto ou ângulos absolutos (0 = para baixo, 90 = para frente)
export type Bend='fwd'|'back'|'up'|'down';
export type Pose={hip:Pt,t:number,hN:Limb,hF:Limb,fN:Limb,fF:Limb,bend?:number,head?:number,knee?:Bend,kneeF?:Bend,elbow?:Bend};
export type FigureSpec={view:'side'|'front',frames:Pose[],equip?:'esteira'|'bicicleta'|'cadeira'|'parede'|'tapete'|'garrafas',hold?:boolean};

export const GROUND=92;
const L={torso:30,neck:3,head:6,upper:14,fore:13,thigh:18,shin:18};
const rad=(d:number)=>d*Math.PI/180;
const dir=(deg:number):Pt=>[Math.sin(rad(deg)),Math.cos(rad(deg))]; // ângulo de segmento: 0 = para baixo
const add=(p:Pt,v:Pt,k=1):Pt=>[p[0]+v[0]*k,p[1]+v[1]*k];
const PREF:Record<Bend,Pt>={fwd:[1,0],back:[-1,0],up:[0,-1],down:[0,1]};

function ik(root:Pt,target:Pt,l1:number,l2:number,bend:Bend):[Pt,Pt]{
 const dx=target[0]-root[0],dy=target[1]-root[1];
 const d=Math.min(Math.max(Math.hypot(dx,dy),Math.abs(l1-l2)+0.01),l1+l2-0.01);
 const base=Math.atan2(dy,dx);
 const cosB=(l1*l1+d*d-l2*l2)/(2*l1*d);const b=Math.acos(Math.max(-1,Math.min(1,cosB)));
 const j1:Pt=[root[0]+l1*Math.cos(base+b),root[1]+l1*Math.sin(base+b)];
 const j2:Pt=[root[0]+l1*Math.cos(base-b),root[1]+l1*Math.sin(base-b)];
 const p=PREF[bend];const score=(j:Pt)=>(j[0]-root[0])*p[0]+(j[1]-root[1])*p[1];
 const joint=score(j1)>=score(j2)?j1:j2;
 const end:Pt=[root[0]+Math.cos(base)*d,root[1]+Math.sin(base)*d];
 return [joint,end];
}
function limb(root:Pt,spec:Limb,l1:number,l2:number,bend:Bend):[Pt,Pt]{
 if('to' in spec)return ik(root,spec.to,l1,l2,bend);
 const j=add(root,dir(spec.a[0]),l1);return [j,add(j,dir(spec.a[1]),l2)];
}

export type Skeleton={head:Pt,neck:Pt,hip:Pt,ctrl:Pt,sN:Pt,sF:Pt,hpN:Pt,hpF:Pt,eN:Pt,wN:Pt,eF:Pt,wF:Pt,kN:Pt,aN:Pt,kF:Pt,aF:Pt,toeN:Pt,toeF:Pt};

export function solve(p:Pose,view:'side'|'front'):Skeleton{
 const td:Pt=[Math.sin(rad(p.t)),-Math.cos(rad(p.t))];
 const neck=add(p.hip,td,L.torso);
 const hd=p.head??0;const headDir:Pt=[Math.sin(rad(p.t+hd)),-Math.cos(rad(p.t+hd))];
 const head=add(neck,headDir,L.neck+L.head);
 const perp:Pt=[td[1],-td[0]]; // perpendicular "para cima" das costas
 const mid:Pt=[(p.hip[0]+neck[0])/2,(p.hip[1]+neck[1])/2];
 const ctrl=add(mid,perp,-(p.bend??0));
 const off=view==='front'?7:0,hoff=view==='front'?4:0;
 const sN:Pt=[neck[0]-off,neck[1]+(view==='front'?2:0)],sF:Pt=[neck[0]+off,neck[1]+(view==='front'?2:0)];
 const hpN:Pt=[p.hip[0]-hoff,p.hip[1]],hpF:Pt=[p.hip[0]+hoff,p.hip[1]];
 const [eN,wN]=limb(sN,p.hN,L.upper,L.fore,p.elbow??'down');
 const [eF,wF]=limb(sF,p.hF,L.upper,L.fore,p.elbow??'down');
 const [kN,aN]=limb(hpN,p.fN,L.thigh,L.shin,p.knee??'fwd');
 const [kF,aF]=limb(hpF,p.fF,L.thigh,L.shin,p.kneeF??p.knee??'fwd');
 // Pé de perfil: aponta para frente; se o tornozelo estiver alto e perto do chão, a ponta toca o chão.
 const toe=(a:Pt):Pt=>{if(view==='front')return [a[0],a[1]+2];const gap=GROUND-a[1];const s=gap>0.5&&gap<6?gap/6:0;return [a[0]+6*Math.sqrt(1-s*s),a[1]+6*s]};
 return {head,neck,hip:p.hip,ctrl,sN,sF,hpN,hpF,eN,wN,eF,wF,kN,aN,kF,aF,toeN:toe(aN),toeF:toe(aF)};
}

const lerp=(a:number,b:number,k:number)=>a+(b-a)*k;
// Ângulos pelo menor caminho: permite círculos completos de braço (270° → 0° continua girando).
const lerpAngle=(a:number,b:number,k:number)=>{const d=((b-a)%360+540)%360-180;return a+d*k};
const lerpPt=(a:Pt,b:Pt,k:number):Pt=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k)];
function lerpLimb(a:Limb,b:Limb,k:number):Limb{
 if('to' in a&&'to' in b)return {to:lerpPt(a.to,b.to,k)};
 if('a' in a&&'a' in b)return {a:[lerpAngle(a.a[0],b.a[0],k),lerpAngle(a.a[1],b.a[1],k)]};
 return k<0.5?a:b;
}
export function interpolate(a:Pose,b:Pose,k:number):Pose{
 const e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2; // suaviza início e fim do movimento
 return {...a,hip:lerpPt(a.hip,b.hip,e),t:lerp(a.t,b.t,e),bend:lerp(a.bend??0,b.bend??0,e),head:lerp(a.head??0,b.head??0,e),hN:lerpLimb(a.hN,b.hN,e),hF:lerpLimb(a.hF,b.hF,e),fN:lerpLimb(a.fN,b.fN,e),fF:lerpLimb(a.fF,b.fF,e),knee:a.knee,kneeF:a.kneeF,elbow:a.elbow};
}
// Fase 0..1 percorre os quadros em sequência e volta ao primeiro.
export function poseAt(spec:FigureSpec,phase:number):Pose{
 const n=spec.frames.length;if(n===1)return spec.frames[0];
 // Normaliza para [0,1): o relógio da animação pode entregar uma fase negativa no primeiro quadro.
 const f=((phase%1)+1)%1,pos=f*n,i=Math.min(n-1,Math.floor(pos)),k=pos-i;
 return interpolate(spec.frames[i],spec.frames[(i+1)%n],k);
}
