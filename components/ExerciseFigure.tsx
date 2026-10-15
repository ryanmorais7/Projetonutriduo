'use client';
import {useEffect,useRef,useState} from 'react';
import {GROUND,poseAt,solve,type FigureSpec,type Pt,type Skeleton} from '@/lib/exercises/figure';

const line=(a:Pt,b:Pt)=>`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
const limb=(a:Pt,b:Pt,c:Pt)=>`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}`;

function Equipment({kind,s}:{kind:FigureSpec['equip'],s:Skeleton}){
 if(kind==='tapete')return <rect x="4" y="88" width="112" height="4" rx="2" className="eq-mat"/>;
 if(kind==='parede'){const x=Math.max(s.wN[0],s.wF[0])+1.5;return <rect x={x} y="6" width="5" height={GROUND-6} className="eq-wall"/>}
 if(kind==='cadeira')return <g className="eq-line"><path d="M28 75H46M28 75V50M30 75V92M44 75V92"/></g>;
 if(kind==='esteira')return <g className="eq-line"><rect x="22" y="86" width="80" height="5" rx="2.5" className="eq-fill"/><path d="M98 86L93 36M93 38H80"/></g>;
 if(kind==='bicicleta')return <g className="eq-line"><circle cx="64" cy="78" r="7" className="eq-faint"/><circle cx="90" cy="70" r="10"/><path d="M44 53H56M50 54L58 78M58 78H90M64 78L77 38M74 38H82M38 92H104M58 78L48 92M90 80L96 92"/></g>;
 if(kind==='garrafas')return <g className="eq-fill">{[s.wN,s.wF].map((w,i)=><rect key={i} x={w[0]-2} y={w[1]-1} width="4" height="9" rx="1.5"/>)}</g>;
 return null;
}

function Figure({s,spec}:{s:Skeleton,spec:FigureSpec}){
 return <>
  <line x1="2" y1={GROUND} x2="118" y2={GROUND} className="fig-ground"/>
  <Equipment kind={spec.equip} s={s}/>
  <g className="fig-far"><path d={limb(s.sF,s.eF,s.wF)}/><path d={limb(s.hpF,s.kF,s.aF)}/><path d={line(s.aF,s.toeF)}/></g>
  <g className="fig-near">
   <path d={`M${s.hip[0].toFixed(1)} ${s.hip[1].toFixed(1)}Q${s.ctrl[0].toFixed(1)} ${s.ctrl[1].toFixed(1)} ${s.neck[0].toFixed(1)} ${s.neck[1].toFixed(1)}`}/>
   <path d={limb(s.hpN,s.kN,s.aN)}/><path d={line(s.aN,s.toeN)}/><path d={limb(s.sN,s.eN,s.wN)}/>
   {spec.view==='front'&&<path d={line(s.sN,s.sF)}/>}
   <circle cx={s.head[0]} cy={s.head[1]} r="6" className="fig-head"/>
  </g>
 </>;
}

// Demonstração animada; com "reduzir movimento" do sistema, mostra as posições de início e fim lado a lado.
export function ExerciseFigure({spec,animate=true,label,className=''}:{spec:FigureSpec,animate?:boolean,label:string,className?:string}){
 const [phase,setPhase]=useState(0),[reduced,setReduced]=useState(false);
 const raf=useRef(0);
 useEffect(()=>{const m=window.matchMedia('(prefers-reduced-motion: reduce)');setReduced(m.matches);const on=()=>setReduced(m.matches);m.addEventListener('change',on);return()=>m.removeEventListener('change',on)},[]);
 useEffect(()=>{
  if(!animate||reduced||spec.frames.length<2)return;
  const period=spec.equip==='bicicleta'?1600:spec.frames.length*1300,start=performance.now();
  const tick=(t:number)=>{setPhase(((t-start)%period)/period);raf.current=requestAnimationFrame(tick)};
  raf.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf.current);
 },[animate,reduced,spec]);
 if(reduced&&animate&&spec.frames.length>1){
  const half=Math.floor(spec.frames.length/2);
  return <div className={`fig-pair ${className}`} role="img" aria-label={`${label}: posição inicial e final`}>{[0,half].map(i=><svg key={i} viewBox="0 0 120 100" aria-hidden><Figure s={solve(spec.frames[i],spec.view)} spec={spec}/></svg>)}</div>;
 }
 // Miniatura estática: a posição final do movimento (o quadro intermediário pode parecer outra postura).
 const pose=animate?poseAt(spec,phase):spec.frames[Math.min(1,spec.frames.length-1)];
 return <svg viewBox="0 0 120 100" className={`fig ${className}`} role="img" aria-label={`Demonstração: ${label}`}><Figure s={solve(pose,spec.view)} spec={spec}/></svg>;
}
