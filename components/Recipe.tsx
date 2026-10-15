'use client';
import {useEffect,useState} from 'react';
import {CalendarPlus,Check,ChevronLeft,ChevronRight,Clock3,Gauge,Heart,ListChecks,LoaderCircle,MessageCircleQuestion,RefreshCw,ShieldAlert,ShoppingCart,Sparkles} from 'lucide-react';
import {dishImage} from '@/lib/catalog';
import {PEOPLE,type Profiles,type Suggestion} from '@/lib/types';
import {Avatar,Img} from './ui';

export const DIFFICULTY={facil:'Fácil',media:'Média',elaborada:'Elaborada'} as const;
const people=(r:Suggestion)=>r.forWho==='ambos'?PEOPLE:[r.forWho];

export function FavButton({on,onToggle,title}:{on:boolean,onToggle:()=>void,title:string}){
 return <button className={`fav-btn ${on?'on':''}`} onClick={e=>{e.stopPropagation();onToggle()}} aria-pressed={on} aria-label={on?`Remover ${title} dos favoritos`:`Favoritar ${title}`}><Heart size={19} fill={on?'currentColor':'none'}/></button>;
}

export function Meta({r}:{r:Suggestion}){
 return <div className="meta">{r.mode==='casa'&&r.minutes>0&&<span><Clock3 size={14}/>{r.minutes} min</span>}{r.mode==='casa'&&<span><Gauge size={14}/>{DIFFICULTY[r.difficulty]}</span>}{r.mode==='delivery'&&<span><Sparkles size={14}/>Ideia de pedido</span>}</div>;
}

export function MiniRecipe({r,fav,onFav,onOpen}:{r:Suggestion,fav:boolean,onFav:()=>void,onOpen:()=>void}){
 return <article className="mini-recipe">
  <button className="mini-hit" onClick={onOpen} aria-label={`Ver receita: ${r.title}`}/>
  <div className="mini-img"><Img src={dishImage(r.image)} alt={`Imagem ilustrativa de ${r.title}`}/><FavButton on={fav} onToggle={onFav} title={r.title}/></div>
  <h3>{r.title}</h3><Meta r={r}/>
  {r.highlights.length>0&&<div className="hl-row">{r.highlights.slice(0,2).map(h=><span key={h} className="hl">{h}</span>)}</div>}
 </article>;
}

export function RecipeCard({r,profiles,fav,onFav,onOpen,onSwap,swapping}:{r:Suggestion,profiles:Profiles,fav:boolean,onFav:()=>void,onOpen:()=>void,onSwap?:()=>void,swapping?:boolean}){
 const have=r.ingredients.filter(i=>i.have),missing=r.ingredients.filter(i=>!i.have);
 return <article className={`recipe-card ${swapping?'is-swapping':''}`}>
  <div className="recipe-img"><Img src={dishImage(r.image,'full')} alt={`Imagem ilustrativa de ${r.title}`}/><span className="img-note">Imagem ilustrativa</span><FavButton on={fav} onToggle={onFav} title={r.title}/></div>
  <div className="recipe-body">
   <Meta r={r}/>
   <h3>{r.title}</h3>
   {r.description&&<p>{r.description}</p>}
   {r.highlights.length>0&&<div className="hl-row">{r.highlights.map(h=><span key={h} className="hl">{h}</span>)}</div>}
   {r.mode==='casa'&&r.ingredients.length>0&&<div className="have-miss">
    {have.length>0&&<p><Check size={14}/><b>Você tem:</b> {have.map(i=>i.name).join(', ')}</p>}
    {missing.length>0&&<p className="miss"><ShoppingCart size={14}/><b>Falta:</b> {missing.map(i=>i.name).join(', ')}</p>}
   </div>}
   {r.forWho==='ambos'&&(r.portions.pessoa1||r.portions.pessoa2)&&<div className="duo-mini">{PEOPLE.map(id=>r.portions[id]&&<div key={id}><Avatar profile={profiles[id]} size={24}/><span><b>{profiles[id].name}</b>{r.portions[id]}</span></div>)}</div>}
   <div className="card-actions">
    <button className="btn primary" onClick={onOpen}>{r.mode==='delivery'?'Ver como pedir':'Ver receita'}</button>
    {onSwap&&<button className="btn soft" onClick={onSwap} disabled={swapping}>{swapping?<LoaderCircle className="spin" size={17}/>:<RefreshCw size={17}/>}Trocar</button>}
   </div>
  </div>
 </article>;
}

export function RecipeDetail({r,profiles,onAddShopping,onAddToPlan}:{r:Suggestion,profiles:Profiles,onAddShopping:(names:string[])=>number,onAddToPlan?:()=>void}){
 const [checked,setChecked]=useState<Set<number>>(new Set()),[step,setStep]=useState(0),[allSteps,setAllSteps]=useState(false),[added,setAdded]=useState('');
 useEffect(()=>{setChecked(new Set());setStep(0);setAllSteps(false);setAdded('')},[r.id]);
 const missing=r.ingredients.filter(i=>!i.have).map(i=>i.name);
 const toAdd=missing.length?missing:r.ingredients.map(i=>i.name);
 const add=()=>{const n=onAddShopping(toAdd);setAdded(n?`${n} ${n===1?'item adicionado':'itens adicionados'} à lista de compras.`:'Esses itens já estavam na lista.')};
 const toggle=(i:number)=>setChecked(s=>{const n=new Set(s);n.has(i)?n.delete(i):n.add(i);return n});
 const who=people(r).filter(id=>r.portions[id]||r.adaptations[id]);
 return <div className="detail">
  <div className="detail-img"><Img src={dishImage(r.image,'full')} alt={`Imagem ilustrativa de ${r.title}`}/><span className="img-note">Imagem ilustrativa</span></div>
  <Meta r={r}/>
  <h2 className="detail-title">{r.title}</h2>
  {r.description&&<p className="lead">{r.description}</p>}
  {r.highlights.length>0&&<div className="hl-row">{r.highlights.map(h=><span key={h} className="hl">{h}</span>)}</div>}

  {who.length>0&&<section className="detail-sec"><h3>{who.length===2?`Para ${profiles.pessoa1.name} e ${profiles.pessoa2.name}`:`Para ${profiles[who[0]].name}`}</h3>
   <div className="duo-cards">{who.map(id=><div key={id} className="duo-card" data-person={id}><div className="duo-head"><Avatar profile={profiles[id]} size={34}/><b>{profiles[id].name}</b></div>{r.portions[id]&&<p><small>Porção sugerida</small>{r.portions[id]}</p>}{r.adaptations[id]&&<p><small>Ajuste</small>{r.adaptations[id]}</p>}</div>)}</div>
   <p className="fineprint">Porções são pontos de partida: ajuste à fome e à orientação profissional de cada um.</p>
  </section>}

  {r.ingredients.length>0&&<section className="detail-sec"><h3>{r.mode==='delivery'?'O que pedir':'Ingredientes'}</h3>
   <ul className="checklist">{r.ingredients.map((i,idx)=><li key={idx}><button className={checked.has(idx)?'done':''} onClick={()=>toggle(idx)} aria-pressed={checked.has(idx)}><span className="box">{checked.has(idx)&&<Check size={14}/>}</span><span className="ing-name">{i.name}{i.qty&&<small> · {i.qty}</small>}</span>{r.mode==='casa'&&<span className={`have-tag ${i.have?'yes':'no'}`}>{i.have?'tem':'falta'}</span>}</button></li>)}</ul>
   {r.mode==='casa'&&<button className="btn soft full" onClick={add}><ShoppingCart size={18}/>{missing.length?`Adicionar ${missing.length} ${missing.length===1?'faltante':'faltantes'} à lista`:'Adicionar ingredientes à lista'}</button>}
   {added&&<p className="ok-note" role="status"><Check size={15}/>{added}</p>}
  </section>}

  {r.steps.length>0&&<section className="detail-sec"><div className="sec-row"><h3>{r.mode==='delivery'?'Como montar o pedido':'Preparo'}</h3><button className="link-btn" onClick={()=>setAllSteps(v=>!v)}><ListChecks size={16}/>{allSteps?'Um passo por vez':'Ver todos'}</button></div>
   {allSteps?<ol className="steps">{r.steps.map((s,i)=><li key={i}>{s}</li>)}</ol>:
   <div className="step-card" aria-live="polite"><span className="step-count">Passo {step+1} de {r.steps.length}</span><p>{r.steps[step]}</p>
    <div className="step-nav"><button className="btn soft" onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}><ChevronLeft size={18}/>Anterior</button>{step<r.steps.length-1?<button className="btn primary" onClick={()=>setStep(s=>s+1)}>Próximo<ChevronRight size={18}/></button>:<span className="step-done"><Check size={16}/>Bom apetite!</span>}</div>
    <div className="step-dots" aria-hidden>{r.steps.map((_,i)=><span key={i} className={i<=step?'on':''}/>)}</div>
   </div>}
  </section>}

  {r.askRestaurant.length>0&&<section className="detail-sec"><h3><MessageCircleQuestion size={18}/>Pergunte ao restaurante</h3><ul className="bullets">{r.askRestaurant.map((q,i)=><li key={i}>{q}</li>)}</ul></section>}
  {r.substitutions.length>0&&<section className="detail-sec"><h3>Substituições</h3><ul className="bullets">{r.substitutions.map((q,i)=><li key={i}>{q}</li>)}</ul></section>}
  {r.nutrition&&<p className="nutri-note">{r.nutrition}</p>}
  {r.cautions.length>0&&<div className="caution"><ShieldAlert size={18}/><div>{r.cautions.map((c,i)=><p key={i}>{c}</p>)}</div></div>}
  {r.mode==='delivery'&&<p className="fineprint">Ideia de pedido, não um restaurante real. Preço e disponibilidade dependem do app de delivery.</p>}
  {onAddToPlan&&<button className="btn ghost full" onClick={onAddToPlan}><CalendarPlus size={18}/>Adicionar ao planejamento</button>}
 </div>;
}
