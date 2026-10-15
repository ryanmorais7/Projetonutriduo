'use client';
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {Plus,UtensilsCrossed,X} from 'lucide-react';
import {COLORS} from '@/lib/catalog';
import type {Profile} from '@/lib/types';

// Imagem com fallback visual: se a foto externa falhar ou estiver offline, mostra um bloco ilustrado.
export function Img({src,alt,className='',label}:{src?:string,alt:string,className?:string,label?:string}){
 const [failed,setFailed]=useState(false);
 if(!src||failed)return <div className={`img-fallback ${className}`} role="img" aria-label={alt}><UtensilsCrossed size={26} aria-hidden/>{label&&<span>{label}</span>}</div>;
 // eslint-disable-next-line @next/next/no-img-element
 return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>;
}

export function Avatar({profile,size=40}:{profile:Pick<Profile,'avatar'|'color'|'name'>,size?:number}){
 const c=COLORS[profile.color];
 return <span className="avatar-badge" style={{width:size,height:size,fontSize:size*0.5,background:c.soft,boxShadow:`inset 0 0 0 2px ${c.main}33`}} aria-hidden>{profile.avatar}</span>;
}

export function Sheet({open,onClose,title,children,footer,size='tall'}:{open:boolean,onClose:()=>void,title:string,children:ReactNode,footer?:ReactNode,size?:'tall'|'auto'}){
 const ref=useRef<HTMLDivElement>(null),titleId=useId();
 useEffect(()=>{
  if(!open)return;
  const prev=document.activeElement as HTMLElement|null;
  document.body.style.overflow='hidden';
  ref.current?.querySelector<HTMLElement>('[data-autofocus],button,input,select,textarea')?.focus({preventScroll:true});
  const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};
  window.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow='';window.removeEventListener('keydown',onKey);prev?.focus?.({preventScroll:true})};
 },[open,onClose]);
 if(!open)return null;
 return <div className="sheet-backdrop" onClick={onClose}>
  <div ref={ref} className={`sheet sheet-${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={e=>e.stopPropagation()}>
   <div className="sheet-head"><span className="sheet-grip" aria-hidden/><h2 id={titleId}>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Fechar"><X size={20}/></button></div>
   <div className="sheet-body">{children}</div>
   {footer&&<div className="sheet-foot">{footer}</div>}
  </div>
 </div>;
}

export function Segmented<T extends string>({value,options,onChange,label}:{value:T,options:{value:T,label:string,icon?:ReactNode}[],onChange:(v:T)=>void,label:string}){
 return <div className="segmented" role="radiogroup" aria-label={label}>{options.map(o=><button key={o.value} role="radio" aria-checked={value===o.value} className={value===o.value?'on':''} onClick={()=>onChange(o.value)}>{o.icon}{o.label}</button>)}</div>;
}

export function TagInput({label,hint,values,onChange,suggestions=[],placeholder='Digite e toque em +'}:{label:string,hint?:string,values:string[],onChange:(v:string[])=>void,suggestions?:string[],placeholder?:string}){
 const [text,setText]=useState(''),id=useId();
 const add=(v:string)=>{const t=v.trim().slice(0,60);if(!t||values.some(x=>x.toLowerCase()===t.toLowerCase())||values.length>=30)return;onChange([...values,t]);setText('')};
 const remaining=suggestions.filter(s=>!values.some(v=>v.toLowerCase()===s.toLowerCase()));
 return <div className="field">
  <label htmlFor={id}>{label}{hint&&<small>{hint}</small>}</label>
  {values.length>0&&<div className="tags">{values.map(v=><span key={v} className="tag">{v}<button onClick={()=>onChange(values.filter(x=>x!==v))} aria-label={`Remover ${v}`}><X size={14}/></button></span>)}</div>}
  <div className="tag-entry"><input id={id} value={text} placeholder={placeholder} maxLength={60} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();add(text)}}}/><button className="icon-btn solid" onClick={()=>add(text)} aria-label={`Adicionar em ${label}`} disabled={!text.trim()}><Plus size={18}/></button></div>
  {remaining.length>0&&<div className="chip-row">{remaining.slice(0,8).map(s=><button key={s} className="chip ghost" onClick={()=>add(s)}><Plus size={13}/>{s}</button>)}</div>}
 </div>;
}

export function SkeletonCards({count=2}:{count?:number}){
 return <div className="skeletons" aria-busy="true" aria-label="Carregando sugestões">{Array.from({length:count},(_,i)=><div key={i} className="skeleton-card"><div className="sk sk-img"/><div className="sk sk-line w70"/><div className="sk sk-line w90"/><div className="sk sk-line w40"/></div>)}</div>;
}

export function Empty({icon,title,text,action}:{icon:ReactNode,title:string,text:string,action?:ReactNode}){
 return <div className="empty"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p>{action}</div>;
}
