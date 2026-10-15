'use client';
import {useState} from 'react';
import {Battery,Check,ChevronLeft,ChevronRight,Dumbbell,Leaf,Scale,Sparkles,Timer,Zap} from 'lucide-react';
import {GOALS,type DietProfile,type GoalKey} from '@/lib/types';
import {IngredientGrid} from './IngredientGrid';
import {Segmented,Sheet,Switch,TagInput} from './ui';

const GOAL_ICONS:Record<GoalKey,typeof Leaf>={massa:Dumbbell,equilibrio:Scale,energia:Zap,disposicao:Battery,praticidade:Timer,leveza:Leaf};
const RESTRICTION_CARDS:{key:string,label:string,apply:(d:DietProfile,on:boolean)=>DietProfile,is:(d:DietProfile)=>boolean}[]=[
 {key:'lactose',label:'Intolerância à lactose',is:d=>d.intolerances.some(x=>/lactose/i.test(x)),apply:(d,on)=>({...d,intolerances:on?[...d.intolerances,'Lactose']:d.intolerances.filter(x=>!/lactose/i.test(x))})},
 {key:'celiac',label:'Doença celíaca',is:d=>d.celiac,apply:(d,on)=>({...d,celiac:on})},
 {key:'gluten',label:'Sensibilidade ao glúten',is:d=>d.intolerances.some(x=>/gl[uú]ten/i.test(x)),apply:(d,on)=>({...d,intolerances:on?[...d.intolerances,'Glúten']:d.intolerances.filter(x=>!/gl[uú]ten/i.test(x))})},
 ...['Amendoim','Castanhas','Frutos do mar','Peixe','Ovo','Leite','Soja'].map(a=>({key:a,label:`Alergia a ${a.toLowerCase()}`,is:(d:DietProfile)=>d.allergies.some(x=>x.toLowerCase()===a.toLowerCase()),apply:(d:DietProfile,on:boolean)=>({...d,allergies:on?[...d.allergies,a]:d.allergies.filter(x=>x.toLowerCase()!==a.toLowerCase())})})),
 {key:'veg',label:'Vegetariana',is:d=>d.vegetarian,apply:(d,on)=>({...d,vegetarian:on})},
];
const ACTIVITY=['Pouca atividade','Caminhadas leves','Treino 2–3x por semana','Treino 4x ou mais'];
const STEPS=['Seu objetivo','Informações físicas (opcional)','Alimentos que você gosta','Alimentos que você não gosta','Restrições alimentares','Rotina e horários','Preferências de refeições','Revisão'];

export function Onboarding({open,initial,name,startAt=0,onClose,onSave}:{open:boolean,initial:DietProfile,name:string,startAt?:number,onClose:()=>void,onSave:(d:DietProfile,generate:boolean)=>void}){
 // Quem abre passa uma "key" nova a cada abertura: o rascunho começa sempre do perfil salvo.
 const [d,setD]=useState<DietProfile>(initial),[step,setStep]=useState(startAt),[body,setBody]=useState(!!(initial.body.weight||initial.body.height||initial.body.age));
 const set=<K extends keyof DietProfile>(k:K,v:DietProfile[K])=>setD(x=>({...x,[k]:v}));
 const toggleIn=(k:'likes'|'avoids',v:string)=>set(k,d[k].some(x=>x.toLowerCase()===v.toLowerCase())?d[k].filter(x=>x.toLowerCase()!==v.toLowerCase()):[...d[k],v].slice(0,30));
 const last=STEPS.length-1;
 const footer=<>
  <button className="btn ghost" onClick={()=>step?setStep(step-1):onClose()}><ChevronLeft size={18}/>{step?'Voltar':'Cancelar'}</button>
  {step<last?<button className="btn primary" onClick={()=>setStep(step+1)}>{step===1&&!body?'Pular':'Continuar'}<ChevronRight size={18}/></button>
   :<button className="btn primary" onClick={()=>onSave({...d,onboarded:true,body:body?d.body:{weight:'',height:'',age:'',activity:''},useBody:body&&d.useBody},true)}><Sparkles size={18}/>Salvar e montar cardápio</button>}
 </>;
 return <Sheet open={open} onClose={onClose} title={`Montar dieta · ${name}`} footer={footer}>
  <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step+1} aria-label="Progresso"><span style={{width:`${((step+1)/STEPS.length)*100}%`}}/></div>
  <p className="step-label">Etapa {step+1} de {STEPS.length}</p>
  <h3 className="step-title">{STEPS[step]}</h3>

  {step===0&&<>
   <div className="pick-grid">{GOALS.map(g=>{const Icon=GOAL_ICONS[g.key],on=d.goals.includes(g.key);return <button key={g.key} className={`pick ${on?'on':''}`} aria-pressed={on} onClick={()=>set('goals',on?d.goals.filter(x=>x!==g.key):[...d.goals,g.key])}><Icon size={24}/><b>{g.label}</b></button>})}</div>
   <label className="field"><span>Quer contar com suas palavras? <small>opcional</small></span><textarea rows={2} maxLength={160} value={d.goal} onChange={e=>set('goal',e.target.value)} placeholder="Ex.: ter mais disposição para treinar à tarde"/></label>
   <p className="fineprint">O NutriDuo não define metas de peso nem de calorias. Os objetivos só orientam as sugestões.</p>
  </>}
  {step===1&&<>
   <Switch checked={body} onChange={setBody} label="Quero informar meus dados físicos" hint="Opcional e privado: fica só no seu perfil."/>
   {body&&<div className="form fade-in">
    <div className="row-3"><label className="field"><span>Peso (kg)</span><input inputMode="decimal" maxLength={6} value={d.body.weight} onChange={e=>set('body',{...d.body,weight:e.target.value})}/></label><label className="field"><span>Altura (cm)</span><input inputMode="numeric" maxLength={3} value={d.body.height} onChange={e=>set('body',{...d.body,height:e.target.value})}/></label><label className="field"><span>Idade</span><input inputMode="numeric" maxLength={3} value={d.body.age} onChange={e=>set('body',{...d.body,age:e.target.value})}/></label></div>
    <div className="field"><span>Atividade física</span><div className="pick-grid two">{ACTIVITY.map(a=><button key={a} className={`pick sm ${d.body.activity===a?'on':''}`} aria-pressed={d.body.activity===a} onClick={()=>set('body',{...d.body,activity:a})}><b>{a}</b></button>)}</div></div>
    <Switch checked={d.useBody} onChange={v=>set('useBody',v)} label="Usar para ajustar o tamanho das porções" hint="Desligado, esses dados não saem do app."/>
   </div>}
  </>}
  {step===2&&<><IngredientGrid selected={d.likes} onToggle={v=>toggleIn('likes',v)} onAddCustom={v=>toggleIn('likes',v)}/>{d.likes.length>0&&<p className="muted">{d.likes.length} escolhidos: {d.likes.join(', ')}</p>}</>}
  {step===3&&<><IngredientGrid selected={d.avoids} onToggle={v=>toggleIn('avoids',v)} onAddCustom={v=>toggleIn('avoids',v)}/>{d.avoids.length>0&&<p className="muted">Vamos evitar: {d.avoids.join(', ')}</p>}</>}
  {step===4&&<>
   <div className="pick-grid">{RESTRICTION_CARDS.map(c=>{const on=c.is(d);return <button key={c.key} className={`pick sm ${on?'on':''}`} aria-pressed={on} onClick={()=>setD(x=>c.apply(x,!on))}>{on&&<Check size={16}/>}<b>{c.label}</b></button>})}</div>
   <TagInput label="Outras alergias" hint="excluídas por completo" values={d.allergies} onChange={v=>set('allergies',v)}/>
   <TagInput label="Outras intolerâncias" values={d.intolerances} onChange={v=>set('intolerances',v)}/>
   <p className="fineprint">Alergia e doença celíaca são tratadas com exclusão total, mas o app não substitui a leitura de rótulos nem a orientação profissional.</p>
  </>}
  {step===5&&<div className="form">
   <div className="row-2"><label className="field"><span>Costumo acordar</span><input type="time" value={d.routine.wake} onChange={e=>e.target.value&&set('routine',{...d.routine,wake:e.target.value})}/></label><label className="field"><span>Costumo dormir</span><input type="time" value={d.routine.sleep} onChange={e=>e.target.value&&set('routine',{...d.routine,sleep:e.target.value})}/></label></div>
   <div className="field"><span>Refeições por dia</span><Segmented label="Refeições por dia" value={d.meals} onChange={v=>set('meals',v)} options={['2','3','4','5+'].map(v=>({value:v as DietProfile['meals'],label:v}))}/></div>
   <div className="field"><span>Tempo para cozinhar</span><Segmented label="Tempo para cozinhar" value={d.cookTime} onChange={v=>set('cookTime',v)} options={[{value:'rapido',label:'Pouco'},{value:'medio',label:'Médio'},{value:'sem_pressa',label:'Sem pressa'}]}/></div>
  </div>}
  {step===6&&<div className="form">
   <div className="field"><span>No café da manhã, prefiro</span><Segmented label="Café da manhã" value={d.breakfast} onChange={v=>set('breakfast',v)} options={[{value:'doce',label:'Doce'},{value:'salgado',label:'Salgado'},{value:'tanto_faz',label:'Tanto faz'}]}/></div>
   <div className="field"><span>Estilo das refeições</span><Segmented label="Estilo" value={d.style} onChange={v=>set('style',v)} options={[{value:'simples',label:'Simples'},{value:'elaborado',label:'Mais elaboradas'}]}/></div>
   <div className="field"><span>Orçamento</span><Segmented label="Orçamento" value={d.budget} onChange={v=>set('budget',v)} options={[{value:'economico',label:'Econômico'},{value:'moderado',label:'Moderado'},{value:'livre',label:'Livre'}]}/></div>
   <label className="field"><span>Algo mais que a IA deva saber? <small>opcional</small></span><textarea rows={2} maxLength={400} value={d.notes} onChange={e=>set('notes',e.target.value)} placeholder="Ex.: gosto de comida bem temperada"/></label>
  </div>}
  {step===7&&<ul className="review-summary">
   {[[0,'Objetivo',[...d.goals.map(g=>GOALS.find(x=>x.key===g)?.label),d.goal].filter(Boolean).join(' · ')||'Não definido'],
     [1,'Dados físicos',body&&(d.body.weight||d.body.height)?`${d.body.weight&&d.body.weight+' kg'} ${d.body.height&&d.body.height+' cm'} ${d.useBody?'(usados nas porções)':'(não usados)'}`:'Não informados'],
     [2,'Gosto de',d.likes.join(', ')||'Nada marcado'],[3,'Não gosto de',d.avoids.join(', ')||'Nada marcado'],
     [4,'Restrições',[...d.intolerances.map(i=>`intolerância: ${i}`),...d.allergies.map(a=>`alergia: ${a}`),d.celiac&&'doença celíaca',d.vegetarian&&'vegetariana'].filter(Boolean).join(', ')||'Nenhuma'],
     [5,'Rotina',`Acordo ${d.routine.wake}, durmo ${d.routine.sleep} · ${d.meals} refeições`],[6,'Preferências',`Café ${d.breakfast==='tanto_faz'?'doce ou salgado':d.breakfast} · ${d.style} · orçamento ${d.budget}`],
   ].map(([i,label,val])=><li key={label as string}><span><b>{label}</b>{val}</span><button className="link-btn" onClick={()=>setStep(i as number)}>Editar</button></li>)}
  </ul>}
 </Sheet>;
}
