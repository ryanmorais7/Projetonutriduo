'use client';
import {useMemo,useRef,useState,type ReactNode} from 'react';
import {Bike,Camera,Check,ChefHat,Coffee,Cookie,Drumstick,Flame,Image as ImageIcon,LoaderCircle,Mic,Package,Plus,Salad,Sandwich,Search,Shuffle,Soup,Sparkles,Square,Trash2,Utensils,X,Fish} from 'lucide-react';
import {useRecorder} from '@/hooks/useRecorder';
import {CATEGORIES,INGREDIENTS,findIngredient,ingredientImage,norm,parseSpoken,type Category} from '@/lib/catalog';
import {compressImage} from '@/lib/image';
import {BUDGETS,CRAVINGS,HUNGER,PEOPLE,type ForWho,type PersonId,type Profiles} from '@/lib/types';
import {api,type VisionItem} from '@/services/api';
import {Avatar,Img,Segmented,Sheet} from './ui';

export type Selected={name:string,qty:string};
export type Craving=typeof CRAVINGS[number]['key'];
export type Budget=typeof BUDGETS[number]['key'];
const HUNGER_ICONS=[Coffee,Cookie,Utensils,Drumstick,Flame];
const CRAVING_ICONS:Record<Craving,typeof Soup>={caseira:Soup,japones:Fish,hamburguer:Sandwich,marmita:Package,saladas:Salad,tanto_faz:Shuffle};

export function mergeSelected(prev:Selected[],add:Selected[]){const map=new Map(prev.map(s=>[norm(s.name),s]));for(const a of add){const k=norm(a.name);if(!k)continue;map.set(k,{name:map.get(k)?.name||a.name,qty:a.qty||map.get(k)?.qty||''})}return [...map.values()].slice(0,40)}

export function HungerPicker({value,onChange,label}:{value:number,onChange:(v:number)=>void,label:string}){
 return <div className="hunger" role="radiogroup" aria-label={label}>{HUNGER.map((h,i)=>{const Icon=HUNGER_ICONS[i];return <button key={h.value} role="radio" aria-checked={value===h.value} className={`hunger-card h${i} ${value===h.value?'on':''}`} onClick={()=>onChange(h.value)}><Icon size={24}/><b>{h.label}</b><small>{h.hint}</small></button>})}</div>;
}

type Props={
 mode:'cozinhar'|'delivery',setMode:(m:'cozinhar'|'delivery')=>void,
 selected:Selected[],setSelected:(fn:(s:Selected[])=>Selected[])=>void,
 hunger:Record<PersonId,number>,setHunger:(id:PersonId,v:number)=>void,
 time:'rapido'|'normal',setTime:(t:'rapido'|'normal')=>void,
 forWho:ForWho,profiles:Profiles,loading:boolean,couple:ReactNode,
 onGenerate:()=>void,onDelivery:(craving:Craving,budget:Budget)=>void,
};

export function ExploreView(p:Props){
 return <div className="view">
  <section className="page-head"><h1>{p.mode==='cozinhar'?'O que tem em casa?':'Pedir delivery'}</h1><p>{p.mode==='cozinhar'?'Toque nos ingredientes, fotografe a geladeira ou fale. Menos digitação, mais comida.':'Escolha por cards e receba ideias de pedido equilibradas.'}</p></section>
  <Segmented label="Tipo de refeição" value={p.mode} onChange={p.setMode} options={[{value:'cozinhar',label:'Cozinhar',icon:<ChefHat size={17}/>},{value:'delivery',label:'Delivery',icon:<Bike size={17}/>}]}/>
  {p.couple}
  {p.mode==='cozinhar'?<CookFlow {...p}/>:<DeliveryFlow loading={p.loading} onSubmit={p.onDelivery} forWho={p.forWho} profiles={p.profiles}/>}
 </div>;
}

function CookFlow(p:Props){
 const [cat,setCat]=useState<Category|'todos'>('todos'),[query,setQuery]=useState(''),[review,setReview]=useState(false);
 const [busy,setBusy]=useState<''|'foto'|'audio'>(''),[error,setError]=useState('');
 const [photoItems,setPhotoItems]=useState<(VisionItem&{on:boolean})[]|null>(null),[photoWarn,setPhotoWarn]=useState('');
 const [transcript,setTranscript]=useState<string|null>(null),[voiceOff,setVoiceOff]=useState<Set<string>>(new Set());
 const camRef=useRef<HTMLInputElement>(null),galRef=useRef<HTMLInputElement>(null);
 const rec=useRecorder(async blob=>{setBusy('audio');setError('');try{const {text}=await api.transcribe(blob);if(!text.trim())setError('Não entendi o áudio. Tente falar de novo, mais perto do microfone.');else{setVoiceOff(new Set());setTranscript(text)}}catch(e){setError(e instanceof Error?e.message:'Falha ao transcrever.')}finally{setBusy('')}});
 const selectedKeys=useMemo(()=>new Set(p.selected.map(s=>norm(s.name))),[p.selected]);
 const q=norm(query);
 const list=INGREDIENTS.filter(i=>(cat==='todos'||i.category===cat)&&(!q||norm(i.name).includes(q)||i.aliases.some(a=>norm(a).includes(q))));
 const customs=p.selected.filter(s=>!INGREDIENTS.some(i=>norm(i.name)===norm(s.name)));
 const toggle=(name:string)=>p.setSelected(s=>selectedKeys.has(norm(name))?s.filter(x=>norm(x.name)!==norm(name)):mergeSelected(s,[{name,qty:''}]));
 const addCustom=()=>{const t=query.trim().slice(0,60);if(t.length<2)return;const found=findIngredient(t);p.setSelected(s=>mergeSelected(s,[{name:found?.name||t.charAt(0).toUpperCase()+t.slice(1),qty:''}]));setQuery('')};
 const voiceItems=useMemo(()=>transcript?parseSpoken(transcript):[],[transcript]);

 async function onPhoto(file?:File){
  if(!file)return;setError('');setBusy('foto');
  try{const data=await compressImage(file);const res=await api.vision(data);
   if(!res.items.length){setError('Não reconheci ingredientes nessa foto. Tente com mais luz ou mais perto.');return}
   setPhotoItems(res.items.map(i=>({...i,name:findIngredient(i.name)?.name||i.name,on:i.confidence!=='baixa'})));setPhotoWarn(res.warning);
  }catch(e){setError(e instanceof Error?e.message:'Não consegui analisar a foto.')}
  finally{setBusy('');if(camRef.current)camRef.current.value='';if(galRef.current)galRef.current.value=''}
 }

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

  <section className="gallery" aria-labelledby="gal-title">
   <h2 id="gal-title" className="sec-title">Toque no que você tem</h2>
   <div className="search"><Search size={18} aria-hidden/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!list.length)addCustom()}} placeholder="Buscar ou adicionar ingrediente" aria-label="Buscar ingrediente"/>{query&&<button className="icon-btn" onClick={()=>setQuery('')} aria-label="Limpar busca"><X size={16}/></button>}</div>
   <div className="cat-row" role="tablist" aria-label="Categorias">{[{key:'todos' as const,label:'Todos'},...CATEGORIES].map(c=><button key={c.key} role="tab" aria-selected={cat===c.key} className={`chip ${cat===c.key?'on':''}`} onClick={()=>setCat(c.key)}>{c.label}</button>)}</div>
   {query.trim().length>1&&!INGREDIENTS.some(i=>norm(i.name)===q)&&<button className="add-custom" onClick={addCustom}><Plus size={17}/>Adicionar “{query.trim()}”</button>}
   {customs.length>0&&<div className="chip-row">{customs.map(c=><button key={c.name} className="chip on" onClick={()=>toggle(c.name)} aria-label={`Remover ${c.name}`}><Check size={14}/>{c.name}{c.qty&&` · ${c.qty}`}<X size={13}/></button>)}</div>}
   <div className="ing-grid">{list.map(i=>{const on=selectedKeys.has(norm(i.name));return <button key={i.id} className={`ing ${on?'on':''}`} aria-pressed={on} onClick={()=>toggle(i.name)}>
    <span className="ing-img"><Img src={ingredientImage(i.img)} alt=""/></span><span className="ing-name">{i.name}</span><span className="ing-check" aria-hidden>{on?<Check size={14}/>:<Plus size={14}/>}</span>
   </button>})}</div>
   {!list.length&&<p className="muted center">Nada com esse nome na galeria. Toque em “Adicionar” acima.</p>}
  </section>

  <section className="panel-sec" aria-labelledby="hunger-title"><h2 id="hunger-title" className="sec-title">Qual a fome agora?</h2>
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

function DeliveryFlow({loading,onSubmit,forWho,profiles}:{loading:boolean,onSubmit:(c:Craving,b:Budget)=>void,forWho:ForWho,profiles:Profiles}){
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
