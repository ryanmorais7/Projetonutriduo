'use client';
import {useEffect,useMemo,useState} from 'react';
import {BookmarkPlus,CalendarPlus,Check,ChefHat,ChevronDown,ChevronLeft,ChevronRight,Clock3,Copy,Flame,Gauge,Heart,ListChecks,LoaderCircle,MessageCircleQuestion,MoreHorizontal,RefreshCw,Repeat2,ShieldAlert,ShoppingCart,Sparkles,ThumbsDown,X} from 'lucide-react';
import {computeNutrition,formatQty,ingredientName,scaleNutrients,toGrams,type IngredientSpec,type Nutrients} from '@/lib/nutrition/calc';
import {getFood,swapOptions,type Unit} from '@/lib/nutrition/foods';
import {CROSS_CONTAMINATION,flagLabel} from '@/lib/restrictions';
import type {PersonId,PublicProfiles,RecipeDetailDTO,Suggestion} from '@/lib/types';
import {api} from '@/services/api';
import {Avatar,RecipeImage,SkeletonCards,Stepper} from './ui';

export const DIFFICULTY={facil:'Fácil',media:'Média',elaborada:'Elaborada'} as const;
const CAT_LABEL:Record<string,string>={cafe:'Café da manhã',almoco:'Almoço',lanche:'Lanche',jantar:'Jantar'};
export const categoryLabel=(r:Suggestion)=>r.mode==='delivery'?'Delivery':r.category==='extra'?(r.highlights.includes('Sobremesa')?'Sobremesa':r.highlights.some(h=>h.includes('treino'))?'Pré/pós-treino':'Extra'):r.category?CAT_LABEL[r.category]:'Receita';
export type Compat={ok:boolean,issues:string[]}|null;

export function FavButton({on,onToggle,title}:{on:boolean,onToggle:()=>void,title:string}){
 return <button className={`fav-btn ${on?'on':''}`} onClick={e=>{e.stopPropagation();onToggle()}} aria-pressed={on} aria-label={on?`Remover ${title} dos favoritos`:`Favoritar ${title}`}><Heart size={19} fill={on?'currentColor':'none'}/></button>;
}
export function Meta({r}:{r:Suggestion}){
 return <div className="meta">{r.mode==='casa'&&r.minutes>0&&<span><Clock3 size={14}/>{r.minutes} min</span>}{r.mode==='casa'&&<span><Gauge size={14}/>{DIFFICULTY[r.difficulty]}</span>}{r.mode==='delivery'&&<span><Sparkles size={14}/>Ideia de pedido</span>}</div>;
}
export const num=(v:number,d=1)=>v.toLocaleString('pt-BR',{maximumFractionDigits:d});
export function MacroLine({r}:{r:Suggestion}){
 if(r.mode==='delivery'||!r.macros)return null;
 if(r.macros.status!=='completo')return <p className="macro-line na">Estimativa nutricional indisponível</p>;
 return <p className="macro-line"><Flame size={14}/><b>{num(r.macros.kcal,0)} kcal</b><span>·</span><b>{num(r.macros.protein)} g</b> proteína<small>/porção</small></p>;
}
function CompatBadge({c}:{c:Compat}){
 if(!c)return null;
 return c.ok?<span className="compat ok"><Check size={13}/>Combina com o perfil</span>:<span className="compat warn" title={c.issues.join('; ')}><ShieldAlert size={13}/>{c.issues[0]}</span>;
}

type CardProps={r:Suggestion,fav:boolean,onFav:()=>void,onOpen:()=>void,compat?:Compat,onSwap?:()=>void,swapping?:boolean,onDislike?:()=>void,onSimilar?:()=>void,onLater?:()=>void,later?:boolean,profiles?:PublicProfiles,variant?:'grid'|'list'};

export function RecipeCard({r,fav,onFav,onOpen,compat,onSwap,swapping,onDislike,onSimilar,onLater,later,profiles,variant='list'}:CardProps){
 const [menu,setMenu]=useState(false);
 const missing=r.ingredients.filter(i=>!i.have&&i.qty!=='a gosto');
 return <article className={`recipe-card ${variant} ${swapping?'is-swapping':''}`}>
  <div className="recipe-img"><RecipeImage image={r.image} thumbs={r.thumbs} title={r.title} full={variant==='list'}/><span className="cat-badge">{categoryLabel(r)}</span><FavButton on={fav} onToggle={onFav} title={r.title}/></div>
  <div className="recipe-body">
   <Meta r={r}/>
   <h3>{r.title}</h3>
   <MacroLine r={r}/>
   <CompatBadge c={compat??null}/>
   {variant==='list'&&r.description&&<p className="desc">{r.description}</p>}
   {r.why&&<p className="why"><Sparkles size={14}/>{r.why}</p>}
   {variant==='list'&&r.mode==='casa'&&missing.length>0&&missing.length<r.ingredients.length&&<p className="miss"><ShoppingCart size={14}/><b>Falta:</b> {missing.map(i=>i.name).join(', ')}</p>}
   {variant==='list'&&r.forWho==='ambos'&&profiles&&(r.portions.pessoa1||r.portions.pessoa2)&&<div className="duo-mini">{(['pessoa1','pessoa2'] as const).map(id=>r.portions[id]&&<div key={id}><Avatar profile={profiles[id]} size={24}/><span><b>{profiles[id].name}</b>{r.portions[id]}</span></div>)}</div>}
   <div className="card-actions">
    <button className="btn primary" onClick={onOpen}>{r.mode==='delivery'?'Ver como pedir':'Ver receita'}</button>
    {onSwap&&<button className="btn soft" onClick={onSwap} disabled={swapping} aria-label="Trocar por outra opção">{swapping?<LoaderCircle className="spin" size={17}/>:<RefreshCw size={17}/>}{variant==='list'&&'Trocar'}</button>}
    {(onDislike||onSimilar||onLater)&&<button className="icon-btn ghost-border" aria-expanded={menu} aria-label="Mais opções" onClick={()=>setMenu(m=>!m)}>{menu?<X size={18}/>:<MoreHorizontal size={18}/>}</button>}
   </div>
   {menu&&<div className="card-menu fade-in">
    {onLater&&<button onClick={()=>{onLater();setMenu(false)}}><BookmarkPlus size={16}/>{later?'Salva para depois':'Salvar para depois'}</button>}
    {onSimilar&&r.recipeId&&<button onClick={()=>{onSimilar();setMenu(false)}}><Repeat2 size={16}/>Mostrar semelhantes</button>}
    {onDislike&&<button onClick={()=>{onDislike();setMenu(false)}}><ThumbsDown size={16}/>Não gostei desta</button>}
   </div>}
  </div>
 </article>;
}

export function MiniRecipe({r,fav,onFav,onOpen}:{r:Suggestion,fav:boolean,onFav:()=>void,onOpen:()=>void}){
 return <article className="mini-recipe">
  <button className="mini-hit" onClick={onOpen} aria-label={`Ver receita: ${r.title}`}/>
  <div className="mini-img"><RecipeImage image={r.image} thumbs={r.thumbs} title={r.title} note={false}/><FavButton on={fav} onToggle={onFav} title={r.title}/></div>
  <h3>{r.title}</h3><Meta r={r}/><MacroLine r={r}/>
 </article>;
}

// ---------- Detalhe ----------
const DETAIL_CACHE=new Map<string,RecipeDetailDTO>();
type Person={id:PersonId,name:string};
const fmt=(v:number|null,d=0,unit='')=>v===null?'—':`${v.toLocaleString('pt-BR',{maximumFractionDigits:d})}${unit}`;

function NutritionTable({cols,portionGrams,sources,partialSat}:{cols:{label:string,n:Nutrients}[],portionGrams:number|null,sources:string[],partialSat:boolean}){
 const rows:[string,(n:Nutrients)=>string][]=[['Calorias',n=>fmt(Math.round(n.kcal),0,' kcal')],['Proteínas',n=>fmt(n.protein,1,' g')],['Carboidratos',n=>fmt(n.carbs,1,' g')],['Gorduras totais',n=>fmt(n.fat,1,' g')],['Gorduras saturadas',n=>fmt(n.sat,1,' g')],['Fibras',n=>fmt(n.fiber,1,' g')],['Sódio',n=>fmt(n.sodium===null?null:Math.round(n.sodium),0,' mg')]];
 return <div className="nutri-table-wrap">
  <table className="nutri-table"><thead><tr><th scope="col">Nutriente</th>{cols.map(c=><th key={c.label} scope="col">{c.label}</th>)}</tr></thead>
   <tbody>{rows.map(([label,f])=><tr key={label}><th scope="row">{label}</th>{cols.map(c=><td key={c.label}>{f(c.n)}</td>)}</tr>)}</tbody></table>
  <ul className="nutri-notes">
   {portionGrams!==null&&<li>Peso estimado da porção: {portionGrams} g (considera o rendimento médio no cozimento).</li>}
   <li>Valores estimados por ingrediente, a partir de tabelas de composição; não são medições de laboratório.</li>
   <li>O sódio não inclui o sal adicionado “a gosto”.</li>
   {partialSat&&<li>Gordura saturada aparece como “—” quando algum ingrediente não tem esse dado na tabela.</li>}
  </ul>
  <details className="sources"><summary>Fontes dos dados ({sources.length})</summary><ul>{sources.map(s=><li key={s}>{s}</li>)}</ul></details>
 </div>;
}

export function RecipeDetail({r,people,couple,onAddShopping,onAddToPlan,fav,onFav,later,onLater,onSimilar}:{
 r:Suggestion,people:Person[],couple:boolean,onAddShopping:(names:string[])=>number,onAddToPlan?:()=>void,
 fav:boolean,onFav:()=>void,later:boolean,onLater:()=>void,onSimilar?:()=>void,
}){
 const [detail,setDetail]=useState<RecipeDetailDTO|null>(r.recipeId?DETAIL_CACHE.get(r.recipeId)||null:null),[err,setErr]=useState('');
 const [portions,setPortions]=useState<Record<string,number>>({}),[swaps,setSwaps]=useState<Record<number,string>>({}),[swapOpen,setSwapOpen]=useState<number|null>(null);
 const [checked,setChecked]=useState<Set<number>>(new Set()),[step,setStep]=useState(0),[allSteps,setAllSteps]=useState(false),[cooking,setCooking]=useState(false),[msg,setMsg]=useState(''),[table,setTable]=useState(false);
 useEffect(()=>{
  setPortions({});setSwaps({});setChecked(new Set());setStep(0);setAllSteps(false);setCooking(false);setMsg('');setTable(false);setErr('');
  if(!r.recipeId){setDetail(null);return}
  const c=DETAIL_CACHE.get(r.recipeId);if(c){setDetail(c);return}
  setDetail(null);let alive=true;
  api.recipe(r.recipeId).then(d=>{DETAIL_CACHE.set(d.id,d);if(alive)setDetail(d)}).catch(e=>alive&&setErr(e instanceof Error?e.message:'Não consegui abrir a receita.'));
  return()=>{alive=false};
 },[r.id,r.recipeId]);
 // Mantém a tela acesa durante o modo de preparo (quando o navegador permite).
 useEffect(()=>{if(!cooking)return;let lock:{release:()=>Promise<void>}|null=null;(navigator as Navigator&{wakeLock?:{request:(t:'screen')=>Promise<{release:()=>Promise<void>}>}}).wakeLock?.request('screen').then(l=>{lock=l}).catch(()=>{});return()=>{lock?.release().catch(()=>{})}},[cooking]);

 const who=couple&&r.forWho==='ambos'?people:people.slice(0,1);
 const portionOf=(id:string)=>portions[id]??1;
 const totalPortions=who.reduce((a,p)=>a+portionOf(p.id),0);

 const specs:IngredientSpec[]|null=useMemo(()=>detail?detail.ingredients.map((i,idx)=>{
  const alt=swaps[idx];if(!alt)return {...i,unit:i.unit as Unit};
  const g=toGrams(getFood(i.food)!,i.amount,i.unit as Unit);
  return {food:alt,amount:g??i.amount,unit:g!==null?'g':i.unit as Unit,cooked:i.cooked};
 }):null,[detail,swaps]);
 const nutrition=useMemo(()=>specs&&detail?computeNutrition(specs,detail.servings):null,[specs,detail]);
 const factor=detail?totalPortions/detail.servings:1;

 const ingredientsView=specs?specs.map((s,i)=>({name:ingredientName(s),qty:s.unit==='agosto'?'a gosto':formatQty(s.amount*factor,s.unit),have:r.ingredients[i]?.have??true,alts:swapOptions(detail!.ingredients[i].food),swapped:!!swaps[i]})):r.ingredients.map(i=>({...i,alts:[],swapped:false}));
 const missing=ingredientsView.filter(i=>!i.have&&i.qty!=='a gosto').map(i=>i.name);
 const add=()=>{const names=missing.length?missing:ingredientsView.filter(i=>i.qty!=='a gosto').map(i=>i.name);const n=onAddShopping(names);setMsg(n?`${n} ${n===1?'item adicionado':'itens adicionados'} à lista de compras.`:'Esses itens já estavam na lista.')};
 const steps=detail?.steps||r.steps;
 const flags=detail?.flags||r.flags||[];

 if(r.recipeId&&!detail)return err?<div className="alert" role="alert">{err}</div>:<SkeletonCards count={1}/>;

 return <div className={`detail ${cooking?'is-cooking':''}`}>
  {!cooking&&<>
   <div className="detail-img"><RecipeImage image={r.image} thumbs={detail?.thumbs||r.thumbs} title={r.title} full/></div>
   <div className="detail-tags"><span className="cat-badge static">{categoryLabel(r)}</span><Meta r={r}/></div>
   <h2 className="detail-title">{r.title}</h2>
   {r.description&&<p className="lead">{r.description}</p>}
   {r.why&&<p className="why"><Sparkles size={14}/>{r.why}</p>}
   {flags.length>0&&<p className="contains">Contém: {flags.map(flagLabel).join(', ')}</p>}

   {nutrition&&<section className="detail-sec">
    <h3>Resumo nutricional <small>por porção</small></h3>
    {nutrition.status==='completo'&&nutrition.perServing?<>
     <div className="macro-chips"><span><b>{num(nutrition.perServing.kcal,0)}</b>kcal</span><span><b>{num(nutrition.perServing.protein)} g</b>proteínas</span><span><b>{num(nutrition.perServing.carbs)} g</b>carboidratos</span><span><b>{num(nutrition.perServing.fat)} g</b>gorduras</span></div>
     <button className="link-btn" aria-expanded={table} onClick={()=>setTable(v=>!v)}><ChevronDown size={16} style={{transform:table?'rotate(180deg)':undefined}}/>{table?'Ocultar tabela nutricional':'Ver tabela nutricional completa'}</button>
     {table&&<NutritionTable portionGrams={nutrition.portionGrams} sources={nutrition.sources} partialSat={nutrition.partialSat} cols={[{label:'Por porção',n:nutrition.perServing},...(who.length>1||portionOf(who[0].id)!==1?who.map(p=>({label:who.length>1?p.name:`Sua parte (${portionOf(p.id).toLocaleString('pt-BR')})`,n:scaleNutrients(nutrition.perServing!,portionOf(p.id))})):[]),{label:`Receita inteira (${detail!.servings})`,n:nutrition.total!}]}/>}
    </>:<p className="nutri-note">Estimativa indisponível: faltam dados confiáveis para {nutrition.missing.join(', ')}.</p>}
   </section>}
   {!detail&&r.macros?.status==='completo'&&<section className="detail-sec"><h3>Resumo nutricional <small>por porção</small></h3><div className="macro-chips"><span><b>{num(r.macros.kcal,0)}</b>kcal</span><span><b>{num(r.macros.protein)} g</b>proteínas</span><span><b>{num(r.macros.carbs)} g</b>carboidratos</span><span><b>{num(r.macros.fat)} g</b>gorduras</span></div><p className="fineprint">Calculado pelo app a partir das tabelas TACO/USDA.</p></section>}

   {detail&&r.mode==='casa'&&<section className="detail-sec"><h3>Porções</h3>
    <p className="fineprint">A receita rende {detail.servings} {detail.servings===1?'porção':'porções'}. As quantidades abaixo acompanham o total escolhido.</p>
    <div className="portion-rows">{who.map(p=><div key={p.id} className="portion-row"><span>{who.length>1?p.name:'Porções'}</span><Stepper label={`porções de ${p.name}`} value={portionOf(p.id)} onChange={v=>setPortions(x=>({...x,[p.id]:v}))}/></div>)}</div>
    {who.length>1&&<p className="fineprint">Total: {totalPortions.toLocaleString('pt-BR')} porções. Os valores de cada pessoa aparecem na tabela nutricional.</p>}
   </section>}

   {(r.portions.pessoa1||r.portions.pessoa2||r.adaptations.pessoa1||r.adaptations.pessoa2)&&<section className="detail-sec"><h3>Sugestão da IA para cada um</h3>
    <div className="duo-cards">{people.filter(p=>r.portions[p.id]||r.adaptations[p.id]).map(p=><div key={p.id} className="duo-card"><b>{p.name}</b>{r.portions[p.id]&&<p><small>Porção</small>{r.portions[p.id]}</p>}{r.adaptations[p.id]&&<p><small>Ajuste</small>{r.adaptations[p.id]}</p>}</div>)}</div>
   </section>}

   {ingredientsView.length>0&&<section className="detail-sec"><h3>{r.mode==='delivery'?'O que pedir':'Ingredientes'}</h3>
    <ul className="checklist">{ingredientsView.map((i,idx)=><li key={idx}>
     <div className="check-row">
      <button className={checked.has(idx)?'done':''} onClick={()=>setChecked(s=>{const n=new Set(s);n.has(idx)?n.delete(idx):n.add(idx);return n})} aria-pressed={checked.has(idx)}><span className="box">{checked.has(idx)&&<Check size={14}/>}</span><span className="ing-name">{i.name}{i.swapped&&<em> (trocado)</em>}<small> · {i.qty}</small></span>{r.mode==='casa'&&i.qty!=='a gosto'&&<span className={`have-tag ${i.have?'yes':'no'}`}>{i.have?'tem':'falta'}</span>}</button>
      {i.alts.length>0&&<button className="icon-btn" aria-label={`Trocar ${i.name}`} aria-expanded={swapOpen===idx} onClick={()=>setSwapOpen(o=>o===idx?null:idx)}><Repeat2 size={17}/></button>}
     </div>
     {swapOpen===idx&&<div className="swap-row fade-in"><span>Trocar por (mesmo peso):</span>{swaps[idx]&&<button className="chip" onClick={()=>{setSwaps(s=>{const n={...s};delete n[idx];return n});setSwapOpen(null)}}>Original</button>}{i.alts.slice(0,6).map(a=><button key={a.id} className={`chip ${swaps[idx]===a.id?'on':''}`} onClick={()=>{setSwaps(s=>({...s,[idx]:a.id}));setSwapOpen(null)}}>{a.name}</button>)}</div>}
    </li>)}</ul>
    {r.mode==='casa'&&<button className="btn soft full" onClick={add}><ShoppingCart size={18}/>{missing.length?`Adicionar ${missing.length} ${missing.length===1?'faltante':'faltantes'} à lista`:'Adicionar ingredientes à lista'}</button>}
    {msg&&<p className="ok-note" role="status"><Check size={15}/>{msg}</p>}
    {(flags.includes('gluten')||flags.includes('lactose')||flags.length>0)&&<p className="fineprint">{CROSS_CONTAMINATION}</p>}
   </section>}
  </>}

  {steps.length>0&&<section className="detail-sec">
   <div className="sec-row"><h3>{r.mode==='delivery'?'Como montar o pedido':'Modo de preparo'}</h3>{!cooking&&<button className="link-btn" onClick={()=>setAllSteps(v=>!v)}><ListChecks size={16}/>{allSteps?'Um passo por vez':'Ver todos'}</button>}</div>
   {allSteps&&!cooking?<ol className="steps">{steps.map((s,i)=><li key={i}>{s}</li>)}</ol>:
   <div className={`step-card ${cooking?'big':''}`} aria-live="polite"><span className="step-count">Passo {step+1} de {steps.length}</span><p>{steps[step]}</p>
    <div className="step-nav"><button className="btn soft" onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}><ChevronLeft size={18}/>Anterior</button>{step<steps.length-1?<button className="btn primary" onClick={()=>setStep(s=>s+1)}>Próximo<ChevronRight size={18}/></button>:<span className="step-done"><Check size={16}/>Bom apetite!</span>}</div>
    <div className="step-dots" aria-hidden>{steps.map((_,i)=><span key={i} className={i<=step?'on':''}/>)}</div>
   </div>}
   {r.mode==='casa'&&<button className={`btn ${cooking?'ghost':'primary'} full`} onClick={()=>{setCooking(c=>!c);setStep(0);setAllSteps(false)}}>{cooking?<><X size={18}/>Sair do modo de preparo</>:<><ChefHat size={18}/>Iniciar preparo</>}</button>}
  </section>}

  {!cooking&&<>
   {(detail?.subs||r.substitutions).length>0&&<section className="detail-sec"><h3>Substituições</h3><ul className="bullets">{(detail?.subs||r.substitutions).map((q,i)=><li key={i}>{q}</li>)}</ul></section>}
   {r.askRestaurant.length>0&&<section className="detail-sec"><h3><MessageCircleQuestion size={18}/>Pergunte ao restaurante</h3><ul className="bullets">{r.askRestaurant.map((q,i)=><li key={i}>{q}</li>)}</ul></section>}
   {r.cautions.length>0&&<div className="caution"><ShieldAlert size={18}/><div>{r.cautions.map((c,i)=><p key={i}>{c}</p>)}</div></div>}
   {r.mode==='delivery'&&<p className="fineprint">Ideia de pedido, não um restaurante real. Preço e disponibilidade dependem do app de delivery.</p>}
   <div className="detail-actions">
    <button className={`btn ${fav?'soft':'primary'}`} onClick={onFav}><Heart size={18} fill={fav?'currentColor':'none'}/>{fav?'Nas favoritas':'Favoritar'}</button>
    <button className="btn soft" onClick={onLater}><BookmarkPlus size={18}/>{later?'Salva p/ depois':'Salvar p/ depois'}</button>
    {onAddToPlan&&<button className="btn soft" onClick={onAddToPlan}><CalendarPlus size={18}/>Pôr no cardápio</button>}
    {onSimilar&&r.recipeId&&<button className="btn soft" onClick={onSimilar}><Copy size={18}/>Semelhantes</button>}
   </div>
  </>}
 </div>;
}
