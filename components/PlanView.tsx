'use client';
import {useState} from 'react';
import {CalendarDays,Check,CircleCheck,Copy,Eye,LoaderCircle,Plus,RefreshCw,Repeat,Share2,ShoppingCart,Sparkles,Trash2,X} from 'lucide-react';
import {dishImage} from '@/lib/catalog';
import {DAYS,MEALS,slotKey,type DayKey,type ForWho,type MealKey,type Plan,type Profiles,type ShoppingItem,type Suggestion} from '@/lib/types';
import {uid} from '@/lib/normalize';
import {Empty,Img,Segmented,Sheet} from './ui';

export const todayKey=():DayKey=>DAYS[(new Date().getDay()+6)%7].key;

type Props={
 plan:Plan,setPlan:(fn:(p:Plan)=>Plan)=>void,profiles:Profiles,defaultFor:ForWho,
 sources:{label:string,items:Suggestion[]}[],onOpen:(r:Suggestion)=>void,
 suggestFor:(day:DayKey,meal:MealKey,forWho:ForWho,exclude:string[])=>Promise<Suggestion|null>,
 shopping:ShoppingItem[],setShopping:(fn:(s:ShoppingItem[])=>ShoppingItem[])=>void,addShopping:(names:string[],source:string)=>number,
};

export function PlanView(p:Props){
 const [tab,setTab]=useState<'semana'|'compras'>('semana'),[day,setDay]=useState<DayKey>(todayKey());
 const [picker,setPicker]=useState<MealKey|null>(null),[pickSrc,setPickSrc]=useState(0),[loadingSlot,setLoadingSlot]=useState(''),[note,setNote]=useState('');
 const set=(key:string,fn:(e:Plan[string]|undefined)=>Plan[string]|undefined)=>p.setPlan(plan=>{const next={...plan};const v=fn(plan[key]);if(v)next[key]=v;else delete next[key];return next});
 async function ai(meal:MealKey){
  const key=slotKey(day,meal),cur=p.plan[key];setLoadingSlot(key);setNote('');
  const r=await p.suggestFor(day,meal,cur?.forWho||p.defaultFor,cur?[cur.recipe.title]:[]);
  if(r)set(key,()=>({recipe:r,forWho:cur?.forWho||p.defaultFor,done:false}));
  setLoadingSlot('');
 }
 function repeat(meal:MealKey){const i=DAYS.findIndex(d=>d.key===day),next=DAYS[(i+1)%7],cur=p.plan[slotKey(day,meal)];if(!cur)return;set(slotKey(next.key,meal),()=>({...cur,done:false}));setNote(`Repetido para ${next.label}.`)}
 function generateList(){
  const entries=Object.values(p.plan).filter(e=>!e.done);
  const total=p.addShopping(entries.flatMap(e=>e.recipe.ingredients.filter(i=>!i.have).map(i=>i.name)),'Plano da semana');
  setNote(entries.length?total?`${total} ${total===1?'item foi':'itens foram'} para a lista de compras.`:'A lista já tem tudo o que falta no plano.':'Adicione refeições ao plano para gerar a lista.');
  if(total)setTab('compras');
 }
 const count=(d:DayKey)=>MEALS.filter(m=>p.plan[slotKey(d,m.key)]).length;
 const forOptions:{value:ForWho,label:string}[]=[{value:'ambos',label:'Nós dois'},{value:'pessoa1',label:p.profiles.pessoa1.name},{value:'pessoa2',label:p.profiles.pessoa2.name}];

 return <div className="view">
  <section className="page-head"><h1>Nossa semana</h1><p>Um plano leve e flexível. Mudou de ideia? Tudo bem, é só trocar.</p></section>
  <Segmented label="Seção do planejamento" value={tab} onChange={setTab} options={[{value:'semana',label:'Semana',icon:<CalendarDays size={17}/>},{value:'compras',label:`Compras${p.shopping.filter(s=>!s.done).length?` · ${p.shopping.filter(s=>!s.done).length}`:''}`,icon:<ShoppingCart size={17}/>}]}/>
  {note&&<p className="ok-note" role="status"><Check size={15}/>{note}</p>}
  {tab==='semana'?<>
   <div className="day-row" role="tablist" aria-label="Dias da semana">{DAYS.map(d=><button key={d.key} role="tab" aria-selected={day===d.key} className={`day ${day===d.key?'on':''} ${d.key===todayKey()?'today':''}`} onClick={()=>{setDay(d.key);setNote('')}}><span>{d.short}</span><i aria-label={`${count(d.key)} refeições`}>{Array.from({length:4},(_,i)=><b key={i} className={i<count(d.key)?'f':''}/>)}</i></button>)}</div>
   <h2 className="sec-title">{DAYS.find(d=>d.key===day)?.label}{day===todayKey()&&<span className="today-tag">hoje</span>}</h2>
   <div className="slots">{MEALS.map(m=>{const key=slotKey(day,m.key),e=p.plan[key],busy=loadingSlot===key;
    return <article key={m.key} className={`slot ${e?.done?'done':''}`}>
     <header><span>{m.label}</span>{e?.done&&<span className="done-badge"><Check size={13}/>Preparada</span>}</header>
     {busy?<div className="slot-loading"><LoaderCircle className="spin" size={20}/>Pensando numa opção…</div>:e?<>
      <button className="slot-recipe" onClick={()=>p.onOpen(e.recipe)}><Img src={dishImage(e.recipe.image)} alt="" className="slot-img"/><span><b>{e.recipe.title}</b><small>{e.recipe.mode==='delivery'?'Ideia de pedido':`${e.recipe.minutes} min`}</small></span><Eye size={18} aria-label="Ver receita"/></button>
      <Segmented label={`Para quem é o ${m.label}`} value={e.forWho} onChange={v=>set(key,x=>x&&{...x,forWho:v})} options={forOptions}/>
      <div className="slot-actions">
       <button className={`btn sm ${e.done?'primary':'soft'}`} aria-pressed={e.done} onClick={()=>set(key,x=>x&&{...x,done:!x.done})}><CircleCheck size={16}/>{e.done?'Preparada':'Marcar preparada'}</button>
       <button className="btn sm soft" onClick={()=>ai(m.key)}><RefreshCw size={16}/>Trocar</button>
       <button className="btn sm soft" onClick={()=>repeat(m.key)}><Repeat size={16}/>Repetir amanhã</button>
       <button className="icon-btn" onClick={()=>set(key,()=>undefined)} aria-label={`Remover ${m.label}`}><Trash2 size={17}/></button>
      </div>
     </>:<div className="slot-empty">
      <button className="btn sm soft" onClick={()=>{setPicker(m.key);setPickSrc(0)}}><Plus size={16}/>Adicionar receita</button>
      <button className="btn sm ghost" onClick={()=>ai(m.key)}><Sparkles size={16}/>Sugerir com IA</button>
     </div>}
    </article>})}</div>
   <button className="btn primary big full" onClick={generateList}><ShoppingCart size={19}/>Gerar lista de compras da semana</button>
   <p className="fineprint">Refeições não marcadas não são falhas: o plano existe para facilitar, não para cobrar.</p>
  </>:<ShoppingList items={p.shopping} setItems={p.setShopping}/>}

  <Sheet open={!!picker} onClose={()=>setPicker(null)} title={`Escolher para ${MEALS.find(m=>m.key===picker)?.label.toLowerCase()||''}`}>
   <Segmented label="Origem da receita" value={String(pickSrc)} onChange={v=>setPickSrc(Number(v))} options={p.sources.map((s,i)=>({value:String(i),label:s.label}))}/>
   {p.sources[pickSrc]?.items.length?<ul className="pick-list">{p.sources[pickSrc].items.map(r=><li key={r.id}><button onClick={()=>{if(picker)set(slotKey(day,picker),()=>({recipe:r,forWho:r.forWho||p.defaultFor,done:false}));setPicker(null)}}><Img src={dishImage(r.image)} alt="" className="slot-img"/><span><b>{r.title}</b><small>{r.mode==='delivery'?'Ideia de pedido':`${r.minutes} min`}</small></span><Plus size={18}/></button></li>)}</ul>:<Empty icon={<Sparkles size={26}/>} title="Nada por aqui ainda" text="Favorite receitas ou peça sugestões para elas aparecerem aqui."/>}
  </Sheet>
 </div>;
}

function ShoppingList({items,setItems}:{items:ShoppingItem[],setItems:(fn:(s:ShoppingItem[])=>ShoppingItem[])=>void}){
 const [text,setText]=useState(''),[msg,setMsg]=useState('');
 const add=()=>{const t=text.trim().slice(0,80);if(!t)return;setItems(s=>[{id:uid(),name:t,done:false,source:''},...s]);setText('')};
 async function share(){
  const body=items.filter(i=>!i.done).map(i=>`• ${i.name}`).join('\n');if(!body)return;
  const text=`Lista de compras NutriDuo\n${body}`;
  try{if(navigator.share){await navigator.share({title:'Lista de compras',text});return}await navigator.clipboard.writeText(text);setMsg('Lista copiada.')}catch{/* compartilhamento cancelado */}
 }
 const pending=items.filter(i=>!i.done),done=items.filter(i=>i.done);
 return <section className="shopping">
  <div className="tag-entry"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')add()}} placeholder="Adicionar item" aria-label="Novo item da lista" maxLength={80}/><button className="icon-btn solid" onClick={add} aria-label="Adicionar item" disabled={!text.trim()}><Plus size={18}/></button></div>
  {!items.length?<Empty icon={<ShoppingCart size={26}/>} title="Lista vazia" text="Adicione itens aqui, pela receita ou gerando a lista da semana."/>:<>
   <ul className="shop-list">{[...pending,...done].map(i=><li key={i.id} className={i.done?'done':''}><button className="shop-check" onClick={()=>setItems(s=>s.map(x=>x.id===i.id?{...x,done:!x.done}:x))} aria-pressed={i.done}><span className="box">{i.done&&<Check size={14}/>}</span><span><b>{i.name}</b>{i.source&&<small>{i.source}</small>}</span></button><button className="icon-btn" onClick={()=>setItems(s=>s.filter(x=>x.id!==i.id))} aria-label={`Remover ${i.name}`}><X size={17}/></button></li>)}</ul>
   <div className="row-actions">
    <button className="btn soft" onClick={share} disabled={!pending.length}>{typeof navigator!=='undefined'&&'share' in navigator?<Share2 size={17}/>:<Copy size={17}/>}Compartilhar</button>
    <button className="btn ghost" onClick={()=>setItems(s=>s.filter(x=>!x.done))} disabled={!done.length}><Trash2 size={17}/>Limpar comprados</button>
   </div>
   {msg&&<p className="ok-note" role="status"><Check size={15}/>{msg}</p>}
  </>}
 </section>;
}
