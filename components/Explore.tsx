'use client';
import {useMemo,useRef,useState,type ReactNode} from 'react';
import {Bike,BookOpen,Camera,Check,Coffee,Cookie,Drumstick,Fish,Flame,Image as ImageIcon,LoaderCircle,Mic,Package,Plus,Refrigerator,Salad,Sandwich,Search,Shuffle,SlidersHorizontal,Soup,Sparkles,Square,Trash2,Utensils,X} from 'lucide-react';
import {useRecorder} from '@/hooks/useRecorder';
import type {Library,LibFilters} from '@/hooks/useLibrary';
import {findIngredient,norm,parseSpoken} from '@/lib/catalog';
import {compressImage} from '@/lib/image';
import {BUDGETS,CRAVINGS,HUNGER,PEOPLE,RECIPE_GOALS,type ForWho,type PersonId,type PublicProfiles,type Suggestion} from '@/lib/types';
import {api,type VisionItem} from '@/services/api';
import {IngredientGrid} from './IngredientGrid';
import {RecipeCard,type Compat} from './Recipe';
import {Avatar,Empty,Segmented,Sheet,SkeletonCards} from './ui';

export type Selected={name:string,qty:string};
export type Craving=typeof CRAVINGS[number]['key'];
export type Budget=typeof BUDGETS[number]['key'];
export type ExploreMode='receitas'|'casa'|'delivery';
const HUNGER_ICONS=[Coffee,Cookie,Utensils,Drumstick,Flame];
const CRAVING_ICONS:Record<Craving,typeof Soup>={caseira:Soup,japones:Fish,hamburguer:Sandwich,marmita:Package,saladas:Salad,tanto_faz:Shuffle};

export function mergeSelected(prev:Selected[],add:Selected[]){const map=new Map(prev.map(s=>[norm(s.name),s]));for(const a of add){const k=norm(a.name);if(!k)continue;map.set(k,{name:map.get(k)?.name||a.name,qty:a.qty||map.get(k)?.qty||''})}return [...map.values()].slice(0,40)}

export function HungerPicker({value,onChange,label}:{value:number,onChange:(v:number)=>void,label:string}){
 return <div className="hunger" role="radiogroup" aria-label={label}>{HUNGER.map((h,i)=>{const Icon=HUNGER_ICONS[i];return <button key={h.value} role="radio" aria-checked={value===h.value} className={`hunger-card h${i} ${value===h.value?'on':''}`} onClick={()=>onChange(h.value)}><Icon size={24}/><b>{h.label}</b><small>{h.hint}</small></button>})}</div>;
}

export type CardHandlers={isFav:(r:Suggestion)=>boolean,toggleFav:(r:Suggestion)=>void,isLater:(r:Suggestion)=>boolean,toggleLater:(r:Suggestion)=>void,open:(r:Suggestion)=>void,dislike:(r:Suggestion)=>void,similar:(r:Suggestion)=>void,compat:(r:Suggestion)=>Compat};

type Props={
 mode:ExploreMode,setMode:(m:ExploreMode)=>void,lib:Library,cards:CardHandlers,
 selected:Selected[],setSelected:(fn:(s:Selected[])=>Selected[])=>void,
 hunger:Record<PersonId,number>,setHunger:(id:PersonId,v:number)=>void,
 time:'rapido'|'normal',setTime:(t:'rapido'|'normal')=>void,
 forWho:ForWho,profiles:PublicProfiles,loading:boolean,couple:ReactNode,
 onGenerate:()=>void,onDelivery:(craving:Craving,budget:Budget)=>void,
};

export function ExploreView(p:Props){
 const head={receitas:['Explorar receitas','Mais de 150 receitas com tabela nutricional. Filtre por tempo, objetivo e o que você tem.'],casa:['O que tem em casa?','Toque nos ingredientes, fotografe a geladeira ou fale.'],delivery:['Pedir delivery','Escolha por cards e receba ideias de pedido equilibradas.']}[p.mode];
 return <div className="view">
  <section className="page-head"><h1>{head[0]}</h1><p>{head[1]}</p></section>
  <Segmented label="Seção do Explorar" value={p.mode} onChange={p.setMode} options={[{value:'receitas',label:'Receitas',icon:<BookOpen size={16}/>},{value:'casa',label:'O que tenho',icon:<Refrigerator size={16}/>},{value:'delivery',label:'Delivery',icon:<Bike size={16}/>}]}/>
  {p.couple}
  {p.mode==='receitas'&&<LibraryView lib={p.lib} cards={p.cards} pantry={p.selected.length} profiles={p.profiles}/>}
  {p.mode==='casa'&&<CookFlow {...p}/>}
  {p.mode==='delivery'&&<DeliveryFlow loading={p.loading} onSubmit={p.onDelivery} forWho={p.forWho} profiles={p.profiles}/>}
 </div>;
}

// ---------- Biblioteca ----------
const TIME_OPTS=[{v:5,l:'Até 5 min'},{v:10,l:'Até 10 min'},{v:20,l:'Até 20 min'},{v:30,l:'Até 30 min'}];
const TYPE_OPTS=[{v:'cafe',l:'Café da manhã'},{v:'almoco',l:'Almoço'},{v:'lanche',l:'Lanche'},{v:'jantar',l:'Jantar'},{v:'sobremesa',l:'Sobremesa'}] as const;
const AVAIL_OPTS=[{v:'todos',l:'Tenho todos os ingredientes'},{v:'falta1',l:'Falta apenas 1 ingrediente'},{v:'geladeira',l:'Usar ingredientes da geladeira'},{v:'comprar',l:'Posso comprar ingredientes'}] as const;

function activeCount(f:LibFilters){return [f.maxTime,f.goal,f.avail,f.noLactose||null,f.noGluten||null,f.vegetarian||null,f.without||null].filter(Boolean).length+(f.personal?0:1)}

function LibraryView({lib,cards,pantry,profiles}:{lib:Library,cards:CardHandlers,pantry:number,profiles:PublicProfiles}){
 const [open,setOpen]=useState(false);
 const f=lib.filters,set=(patch:Partial<LibFilters>)=>lib.setFilters({...f,...patch});
 const n=activeCount(f);
 const chips:{label:string,clear:()=>void}[]=[
  ...(f.maxTime?[{label:TIME_OPTS.find(t=>t.v===f.maxTime)?.l||'',clear:()=>set({maxTime:undefined})}]:[]),
  ...(f.goal?[{label:RECIPE_GOALS.find(g=>g.key===f.goal)?.label||'',clear:()=>set({goal:undefined})}]:[]),
  ...(f.avail?[{label:AVAIL_OPTS.find(a=>a.v===f.avail)?.l||'',clear:()=>set({avail:undefined})}]:[]),
  ...(f.noLactose?[{label:'Sem lactose',clear:()=>set({noLactose:false})}]:[]),
  ...(f.noGluten?[{label:'Sem glúten',clear:()=>set({noGluten:false})}]:[]),
  ...(f.vegetarian?[{label:'Vegetariana',clear:()=>set({vegetarian:false})}]:[]),
  ...(f.without?[{label:`Sem ${f.without}`,clear:()=>set({without:''})}]:[]),
  ...(!f.personal?[{label:'Ignorando meu perfil',clear:()=>set({personal:true})}]:[]),
 ];
 return <section className="library">
  <div className="search"><Search size={18} aria-hidden/><input value={f.q} onChange={e=>set({q:e.target.value})} placeholder="Buscar por nome ou ingrediente" aria-label="Buscar receitas"/>{f.q&&<button className="icon-btn" onClick={()=>set({q:''})} aria-label="Limpar busca"><X size={16}/></button>}</div>
  <div className="cat-row" role="tablist" aria-label="Tipo de refeição">
   <button role="tab" aria-selected={!f.meal} className={`chip ${!f.meal?'on':''}`} onClick={()=>set({meal:undefined})}>Todas</button>
   {TYPE_OPTS.map(t=><button key={t.v} role="tab" aria-selected={f.meal===t.v} className={`chip ${f.meal===t.v?'on':''}`} onClick={()=>set({meal:f.meal===t.v?undefined:t.v})}>{t.l}</button>)}
  </div>
  <div className="lib-tools">
   <button className="btn soft sm" onClick={()=>setOpen(true)}><SlidersHorizontal size={16}/>Filtros{n>0&&<span className="count-dot">{n}</span>}</button>
   <button className="btn soft sm" onClick={lib.surprise}><Shuffle size={16}/>Surpreenda-me</button>
  </div>
  {(chips.length>0||lib.similar)&&<div className="chip-row">{lib.similar&&<button className="chip on" onClick={()=>lib.setSimilar(null)}>Semelhantes a “{lib.similar.title}” <X size={13}/></button>}{chips.map(c=><button key={c.label} className="chip on" onClick={c.clear}>{c.label}<X size={13}/></button>)}</div>}
  {!lib.loading&&!lib.error&&<p className="muted result-count">{lib.total} {lib.total===1?'receita encontrada':'receitas encontradas'}</p>}
  {lib.error&&<div className="alert" role="alert">{lib.error}</div>}
  {lib.items.length>0&&<div className="card-grid">{lib.items.map(r=><RecipeCard key={r.id} r={r} variant="grid" profiles={profiles} fav={cards.isFav(r)} onFav={()=>cards.toggleFav(r)} onOpen={()=>cards.open(r)} compat={cards.compat(r)} later={cards.isLater(r)} onLater={()=>cards.toggleLater(r)} onDislike={()=>{cards.dislike(r);lib.hide(r.id)}} onSimilar={()=>cards.similar(r)}/>)}</div>}
  {lib.loading&&<SkeletonCards count={lib.items.length?2:4} grid/>}
  {!lib.loading&&!lib.items.length&&!lib.error&&<Empty icon={<Search size={26}/>} title="Nada com esses filtros" text="Tente remover algum filtro ou buscar por outro ingrediente." action={<button className="btn primary" onClick={lib.reset}>Limpar filtros</button>}/>}
  {lib.hasMore&&!lib.loading&&<button className="btn ghost full" onClick={lib.loadMore}><Plus size={18}/>Ver mais opções</button>}

  <Sheet open={open} onClose={()=>setOpen(false)} title="Filtros" footer={<><button className="btn ghost" onClick={()=>{lib.reset();setOpen(false)}}>Limpar</button><button className="btn primary" onClick={()=>setOpen(false)}>Ver {lib.total} receitas</button></>}>
   <FilterGroup title="Tempo">{[...TIME_OPTS,{v:0,l:'Sem preferência'}].map(t=><button key={t.v} className={`pick sm ${(f.maxTime||0)===t.v?'on':''}`} aria-pressed={(f.maxTime||0)===t.v} onClick={()=>set({maxTime:t.v||undefined})}><b>{t.l}</b></button>)}</FilterGroup>
   <FilterGroup title="Objetivo">{RECIPE_GOALS.map(g=><button key={g.key} className={`pick sm ${f.goal===g.key?'on':''}`} aria-pressed={f.goal===g.key} onClick={()=>set({goal:f.goal===g.key?undefined:g.key})}><b>{g.label}</b></button>)}</FilterGroup>
   <FilterGroup title="Tipo">{TYPE_OPTS.map(t=><button key={t.v} className={`pick sm ${f.meal===t.v?'on':''}`} aria-pressed={f.meal===t.v} onClick={()=>set({meal:f.meal===t.v?undefined:t.v})}><b>{t.l}</b></button>)}</FilterGroup>
   <FilterGroup title="Disponibilidade" hint={pantry?`Usa os ${pantry} ingredientes marcados em “O que tenho”.`:'Marque ingredientes em “O que tenho” para estes filtros funcionarem.'}>{AVAIL_OPTS.map(a=><button key={a.v} className={`pick sm ${f.avail===a.v?'on':''}`} aria-pressed={f.avail===a.v} onClick={()=>set({avail:f.avail===a.v?undefined:a.v})}><b>{a.l}</b></button>)}</FilterGroup>
   <FilterGroup title="Preferências">
    <button className={`pick sm ${f.noLactose?'on':''}`} aria-pressed={f.noLactose} onClick={()=>set({noLactose:!f.noLactose})}><b>Sem lactose</b></button>
    <button className={`pick sm ${f.noGluten?'on':''}`} aria-pressed={f.noGluten} onClick={()=>set({noGluten:!f.noGluten})}><b>Sem glúten</b></button>
    <button className={`pick sm ${f.vegetarian?'on':''}`} aria-pressed={f.vegetarian} onClick={()=>set({vegetarian:!f.vegetarian})}><b>Vegetariana</b></button>
    <button className={`pick sm ${f.personal?'on':''}`} aria-pressed={f.personal} onClick={()=>set({personal:!f.personal})}><b>Personalizadas pelo perfil</b></button>
   </FilterGroup>
   <label className="field"><span>Sem determinado ingrediente</span><input value={f.without} maxLength={40} onChange={e=>set({without:e.target.value})} placeholder="Ex.: cebola"/></label>
   <p className="fineprint">“Sem lactose/glúten” olha a composição das receitas. Em caso de alergia ou doença celíaca, confira sempre os rótulos e o risco de contaminação cruzada.</p>
  </Sheet>
 </section>;
}
function FilterGroup({title,hint,children}:{title:string,hint?:string,children:ReactNode}){return <fieldset className="filter-group"><legend>{title}</legend>{hint&&<p className="fineprint">{hint}</p>}<div className="pick-grid">{children}</div></fieldset>}

// ---------- O que tenho ----------
function CookFlow(p:Props){
 const [review,setReview]=useState(false),[busy,setBusy]=useState<''|'foto'|'audio'>(''),[error,setError]=useState('');
 const [photoItems,setPhotoItems]=useState<(VisionItem&{on:boolean})[]|null>(null),[photoWarn,setPhotoWarn]=useState('');
 const [transcript,setTranscript]=useState<string|null>(null),[voiceOff,setVoiceOff]=useState<Set<string>>(new Set());
 const camRef=useRef<HTMLInputElement>(null),galRef=useRef<HTMLInputElement>(null);
 const rec=useRecorder(async blob=>{setBusy('audio');setError('');try{const {text}=await api.transcribe(blob);if(!text.trim())setError('Não entendi o áudio. Tente falar de novo, mais perto do microfone.');else{setVoiceOff(new Set());setTranscript(text)}}catch(e){setError(e instanceof Error?e.message:'Falha ao transcrever.')}finally{setBusy('')}});
 const toggle=(name:string)=>p.setSelected(s=>s.some(x=>norm(x.name)===norm(name))?s.filter(x=>norm(x.name)!==norm(name)):mergeSelected(s,[{name,qty:''}]));
 const voiceItems=useMemo(()=>transcript?parseSpoken(transcript):[],[transcript]);
 async function onPhoto(file?:File){
  if(!file)return;setError('');setBusy('foto');
  try{const data=await compressImage(file);const res=await api.vision(data);
   if(!res.items.length){setError('Não reconheci ingredientes nessa foto. Tente com mais luz ou mais perto.');return}
   setPhotoItems(res.items.map(i=>({...i,name:findIngredient(i.name)?.name||i.name,on:i.confidence!=='baixa'})));setPhotoWarn(res.warning);
  }catch(e){setError(e instanceof Error?e.message:'Não consegui analisar a foto.')}
  finally{setBusy('');if(camRef.current)camRef.current.value='';if(galRef.current)galRef.current.value=''}
 }
 const customs=p.selected.filter(s=>!findIngredient(s.name)||norm(findIngredient(s.name)!.name)!==norm(s.name));
 return <>
  <div className="input-methods">
   <button className="method m-photo" onClick={()=>camRef.current?.click()} disabled={!!busy||rec.recording}>{busy==='foto'?<LoaderCircle className="spin" size={26}/>:<Camera size={26}/>}<b>Fotografar ingredientes</b><small>{busy==='foto'?'Analisando a foto…':'Geladeira, despensa ou bancada'}</small></button>
   <button className={`method m-voice ${rec.recording?'live':''}`} onClick={rec.recording?rec.stop:rec.start} disabled={busy==='foto'||busy==='audio'}>{busy==='audio'?<LoaderCircle className="spin" size={26}/>:rec.recording?<Square size={24} fill="currentColor"/>:<Mic size={26}/>}<b>{rec.recording?'Parar e transcrever':'Falar o que tenho'}</b><small>{busy==='audio'?'Transcrevendo…':rec.recording?`Gravando… 0:${String(rec.seconds).padStart(2,'0')}`:'“Tenho arroz, ovos e frango”'}</small></button>
  </div>
  <button className="link-btn gallery-link" onClick={()=>galRef.current?.click()} disabled={!!busy}><ImageIcon size={16}/>Escolher foto da galeria</button>
  <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={e=>onPhoto(e.target.files?.[0])}/>
  <input ref={galRef} type="file" accept="image/*" hidden onChange={e=>onPhoto(e.target.files?.[0])}/>
  {rec.recording&&<div className="rec-bar" role="status"><span className="rec-dot" aria-hidden/>Gravando · 0:{String(rec.seconds).padStart(2,'0')} de 1:00<button className="btn soft sm" onClick={rec.cancel}><X size={16}/>Cancelar</button></div>}
  {(error||rec.error)&&<div className="alert" role="alert">{error||rec.error}<button className="icon-btn" aria-label="Fechar aviso" onClick={()=>{setError('');rec.setError('')}}><X size={16}/></button></div>}
  {customs.length>0&&<div className="chip-row">{customs.map(c=><button key={c.name} className="chip on" onClick={()=>toggle(c.name)} aria-label={`Remover ${c.name}`}><Check size={14}/>{c.name}{c.qty&&` · ${c.qty}`}<X size={13}/></button>)}</div>}
  <IngredientGrid title="Toque no que você tem" selected={p.selected.map(s=>s.name)} onToggle={toggle} onAddCustom={name=>p.setSelected(s=>mergeSelected(s,[{name,qty:''}]))}/>
  <section className="panel-sec"><h2 className="sec-title">Qual a fome agora?</h2>
   {(p.forWho==='ambos'?PEOPLE:[p.forWho]).map(id=><div key={id} className="hunger-person">{p.forWho==='ambos'&&<div className="hp-head"><Avatar profile={p.profiles[id]} size={26}/><b>{p.profiles[id].name}</b></div>}<HungerPicker label={`Fome de ${p.profiles[id].name}`} value={p.hunger[id]} onChange={v=>p.setHunger(id,v)}/></div>)}
   <p className="fineprint">A fome só ajusta o tamanho das sugestões. Nenhuma refeição precisa ser pulada.</p>
  </section>
  <section className="panel-sec"><h2 className="sec-title">Quanto tempo temos?</h2>
   <Segmented label="Tempo de preparo" value={p.time} onChange={p.setTime} options={[{value:'rapido',label:'Rápido · até 20 min'},{value:'normal',label:'Sem pressa'}]}/>
  </section>
  <div className="cta-spacer"/>
  <div className="cta-bar">
   <button className="cta-count" onClick={()=>setReview(true)} disabled={!p.selected.length}><b>{p.selected.length}</b> {p.selected.length===1?'ingrediente selecionado':'ingredientes selecionados'}{p.selected.length>0&&<small>Revisar</small>}</button>
   <button className="btn primary" onClick={p.onGenerate} disabled={p.loading||!p.selected.length}>{p.loading?<LoaderCircle className="spin" size={18}/>:<Sparkles size={18}/>}Criar refeições</button>
  </div>
  <Sheet open={review} onClose={()=>setReview(false)} title="Seus ingredientes" footer={<><button className="btn ghost" onClick={()=>{p.setSelected(()=>[]);setReview(false)}}><Trash2 size={17}/>Limpar seleção</button><button className="btn primary" onClick={()=>{setReview(false);p.onGenerate()}} disabled={!p.selected.length||p.loading}><Sparkles size={17}/>Criar refeições</button></>}>
   <p className="muted">Quantidade é opcional, mas ajuda nas porções.</p>
   <ul className="review-list">{p.selected.map(s=><li key={s.name}><span>{s.name}</span><input aria-label={`Quantidade de ${s.name}`} placeholder="qtd." value={s.qty} maxLength={30} onChange={e=>p.setSelected(list=>list.map(x=>x.name===s.name?{...x,qty:e.target.value}:x))}/><button className="icon-btn" onClick={()=>toggle(s.name)} aria-label={`Remover ${s.name}`}><X size={18}/></button></li>)}</ul>
  </Sheet>
  <Sheet open={!!photoItems} onClose={()=>setPhotoItems(null)} title="Encontrei na foto" footer={<button className="btn primary full" onClick={()=>{p.setSelected(s=>mergeSelected(s,(photoItems||[]).filter(i=>i.on).map(i=>({name:i.name,qty:''}))));setPhotoItems(null)}}><Check size={18}/>Adicionar {photoItems?.filter(i=>i.on).length||0} selecionados</button>}>
   <p className="muted">Toque para marcar ou desmarcar. A IA pode errar ou deixar itens de fora.</p>
   <div className="chip-row big">{photoItems?.map((i,idx)=><button key={idx} className={`chip ${i.on?'on':''}`} aria-pressed={i.on} onClick={()=>setPhotoItems(list=>list&&list.map((x,j)=>j===idx?{...x,on:!x.on}:x))}>{i.on?<Check size={14}/>:<Plus size={14}/>}{i.name}{i.confidence==='baixa'&&<small> (incerto)</small>}</button>)}</div>
   {photoWarn&&<p className="fineprint">{photoWarn}</p>}
   <p className="fineprint">A foto foi usada só para esta análise e não fica salva.</p>
  </Sheet>
  <Sheet open={transcript!==null} onClose={()=>setTranscript(null)} title="Confira o que entendi" footer={<button className="btn primary full" disabled={!voiceItems.some(v=>!voiceOff.has(v.name))} onClick={()=>{p.setSelected(s=>mergeSelected(s,voiceItems.filter(v=>!voiceOff.has(v.name))));setTranscript(null)}}><Check size={18}/>Adicionar {voiceItems.filter(v=>!voiceOff.has(v.name)).length} ingredientes</button>}>
   <label className="field"><span>Texto transcrito (pode corrigir)</span><textarea rows={3} value={transcript||''} onChange={e=>setTranscript(e.target.value)}/></label>
   <div className="chip-row big">{voiceItems.map(v=>{const on=!voiceOff.has(v.name);return <button key={v.name} className={`chip ${on?'on':''}`} aria-pressed={on} onClick={()=>setVoiceOff(s=>{const n=new Set(s);on?n.add(v.name):n.delete(v.name);return n})}>{on?<Check size={14}/>:<Plus size={14}/>}{v.name}{v.qty&&<small> · {v.qty}</small>}</button>})}</div>
   {!voiceItems.length&&<p className="muted">Não encontrei alimentos no texto. Corrija acima ou grave de novo.</p>}
  </Sheet>
 </>;
}

// ---------- Delivery ----------
function DeliveryFlow({loading,onSubmit,forWho,profiles}:{loading:boolean,onSubmit:(c:Craving,b:Budget)=>void,forWho:ForWho,profiles:PublicProfiles}){
 const [craving,setCraving]=useState<Craving|null>(null),[budget,setBudget]=useState<Budget|null>(null);
 return <>
  <section className="panel-sec"><h2 className="sec-title">O que você está com vontade de comer?</h2>
   <div className="pick-grid">{CRAVINGS.map(c=>{const Icon=CRAVING_ICONS[c.key];return <button key={c.key} className={`pick ${craving===c.key?'on':''}`} aria-pressed={craving===c.key} onClick={()=>setCraving(c.key)}><Icon size={26}/><b>{c.label}</b></button>})}</div>
  </section>
  {craving&&<section className="panel-sec fade-in"><h2 className="sec-title">Quanto pretende gastar?</h2>
   <div className="pick-grid two">{BUDGETS.map(b=><button key={b.key} className={`pick ${budget===b.key?'on':''}`} aria-pressed={budget===b.key} onClick={()=>setBudget(b.key)}><b>{b.label}</b></button>)}</div>
  </section>}
  {craving&&budget&&<button className="btn primary big full fade-in" onClick={()=>onSubmit(craving,budget)} disabled={loading}>{loading?<LoaderCircle className="spin" size={19}/>:<Sparkles size={19}/>}Ver ideias de pedido {forWho==='ambos'?'para nós dois':`para ${profiles[forWho].name}`}</button>}
  <p className="fineprint">O NutriDuo não está conectado a apps de delivery: as ideias são tipos de pedido, não restaurantes reais, e não mostram preços atuais.</p>
 </>;
}
