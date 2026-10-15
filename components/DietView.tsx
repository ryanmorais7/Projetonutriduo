'use client';
import type {ReactNode} from 'react';
import {Activity,ArrowRight,CalendarDays,Clock3,Dumbbell,Feather,Flame,Home,LoaderCircle,Pencil,Salad,ShoppingCart,Sparkles,Utensils,Wand2} from 'lucide-react';
import {GOALS,DAYS,INTENTS,MEALS,slotKey,type DayKey,type DietProfile,type Intent,type MealKey,type Plan,type Suggestion} from '@/lib/types';
import {todayKey} from './PlanView';
import {RecipeImage} from './ui';

const INTENT_ICONS:Record<Intent,typeof Salad>={leve:Feather,satisfeito:Utensils,fome:Flame,rapido:Clock3,treino:Dumbbell,casa:Home};
const MEAL_SHORT:Record<MealKey,string>={cafe:'Café',almoco:'Almoço',lanche:'Tarde',jantar:'Jantar'};

export function DietView({name,diet,plan,meal,setMeal,autoMeal,trainedToday,shoppingCount,busyIntent,generating,onIntent,onOpen,onOnboard,onEditPrefs,onGenerateWeek,onGoPlan,onGoShopping,couple}:{
 name:string,diet:DietProfile,plan:Plan,meal:MealKey,setMeal:(m:MealKey|null)=>void,autoMeal:MealKey,trainedToday:boolean,shoppingCount:number,couple:ReactNode,
 busyIntent:Intent|null,generating:boolean,onIntent:(i:Intent)=>void,onOpen:(r:Suggestion)=>void,onOnboard:()=>void,onEditPrefs:()=>void,
 onGenerateWeek:()=>void,onGoPlan:(day?:DayKey)=>void,onGoShopping:()=>void,
}){
 const today=todayKey();
 const todays=MEALS.map(m=>({m,e:plan[slotKey(today,m.key)]}));
 const planned=todays.filter(x=>x.e?.recipe.macros?.status==='completo');
 const sum=planned.reduce((a,x)=>({kcal:a.kcal+x.e!.recipe.macros!.kcal,protein:a.protein+x.e!.recipe.macros!.protein}),{kcal:0,protein:0});
 const filled=Object.keys(plan).length;
 const restr=[...diet.intolerances.map(i=>`Sem ${i.toLowerCase()}`),...diet.allergies.map(a=>`Alergia: ${a.toLowerCase()}`),diet.celiac&&'Doença celíaca',diet.vegetarian&&'Vegetariana'].filter(Boolean) as string[];
 return <div className="view">
  <section className="page-head"><h1>Minha dieta</h1><p>Plano alimentar de {name}: flexível, sem metas de calorias e sem punição.</p></section>

  {!diet.onboarded&&<button className="hero-card" onClick={onOnboard}><span className="hero-card-icon"><Wand2 size={26}/></span><span><b>Monte sua dieta em 8 passos</b><small>Toque em cards: objetivo, gostos, restrições e rotina. Leva uns 2 minutos.</small></span><ArrowRight size={20}/></button>}

  <section aria-labelledby="now-title">
   <h2 id="now-title" className="sec-title">Sugestões para agora</h2>
   <div className="cat-row" role="radiogroup" aria-label="Refeição">{MEALS.map(m=><button key={m.key} role="radio" aria-checked={meal===m.key} className={`chip ${meal===m.key?'on':''}`} onClick={()=>setMeal(m.key===autoMeal?null:m.key)}>{MEAL_SHORT[m.key]}{m.key===autoMeal&&<small> · agora</small>}</button>)}</div>
   {couple}
   {trainedToday&&<p className="context-note"><Activity size={15}/>Você registrou um treino hoje: as sugestões consideram isso, sem “compensar” nada.</p>}
   <div className="intent-grid">{INTENTS.map(i=>{const Icon=INTENT_ICONS[i.key];return <button key={i.key} className={`intent i-${i.key}`} onClick={()=>onIntent(i.key)} disabled={!!busyIntent}>{busyIntent===i.key?<LoaderCircle className="spin" size={22}/>:<Icon size={22}/>}<b>{i.label}</b></button>})}</div>
  </section>

  <section aria-labelledby="today-title">
   <div className="sec-row"><h2 id="today-title" className="sec-title">Hoje</h2><button className="link-btn" onClick={()=>onGoPlan(today)}>Abrir o dia</button></div>
   <div className="today-meals">{todays.map(({m,e})=>e?<button key={m.key} className={`tm-row ${e.done?'done':''}`} onClick={()=>onOpen(e.recipe)}>
     <span className="tm-img"><RecipeImage image={e.recipe.image} thumbs={e.recipe.thumbs} title={e.recipe.title} note={false}/></span>
     <span className="tm-text"><small>{m.label}{e.done&&' · feita'}</small><b>{e.recipe.title}</b>{e.recipe.macros?.status==='completo'&&<em>{e.recipe.macros.kcal} kcal · {e.recipe.macros.protein.toLocaleString('pt-BR')} g proteína</em>}</span>
    </button>:<button key={m.key} className="tm-row empty" onClick={()=>onGoPlan(today)}><span className="tm-text"><small>{m.label}</small><b>Escolher refeição</b></span></button>)}</div>
   {planned.length>0&&<p className="fineprint">Soma estimada do que está planejado (1 porção de cada): {Math.round(sum.kcal)} kcal e {Math.round(sum.protein)} g de proteína. É informação, não meta.</p>}
  </section>

  <section aria-labelledby="week-title">
   <div className="sec-row"><h2 id="week-title" className="sec-title">Meu cardápio semanal</h2><span className="muted">{filled}/28</span></div>
   <div className="week-mini">{DAYS.map(d=>{const items=MEALS.map(m=>plan[slotKey(d.key,m.key)]);return <button key={d.key} className={`wm-day ${d.key===today?'today':''}`} onClick={()=>onGoPlan(d.key)}><b>{d.short}</b><span className="wm-dots">{items.map((x,i)=><i key={i} className={x?x.done?'d':'f':''}/>)}</span><small>{items.find(Boolean)?.recipe.title||'Vazio'}</small></button>})}</div>
   <div className="row-actions">
    <button className="btn primary" onClick={onGenerateWeek} disabled={generating}>{generating?<LoaderCircle className="spin" size={18}/>:<Sparkles size={18}/>}{filled?'Completar a semana':'Montar minha semana'}</button>
    <button className="btn soft" onClick={()=>onGoPlan()}><CalendarDays size={18}/>Ver semana</button>
   </div>
   <p className="fineprint">Monta só as refeições vazias, sem repetir pratos e aproveitando ingredientes entre os dias. O que você já escolheu é mantido.</p>
  </section>

  <section aria-labelledby="pref-title">
   <div className="sec-row"><h2 id="pref-title" className="sec-title">Minhas preferências alimentares</h2><button className="link-btn" onClick={onEditPrefs}><Pencil size={15}/>Editar</button></div>
   <div className="pref-card">
    <p><b>Objetivo</b>{[...diet.goals.map(g=>GOALS.find(x=>x.key===g)?.label),diet.goal].filter(Boolean).join(' · ')||'Ainda não definido'}</p>
    <p><b>Restrições</b>{restr.join(', ')||'Nenhuma cadastrada'}</p>
    <p><b>Não gosto</b>{diet.avoids.join(', ')||'Nada marcado'}</p>
    <p><b>Rotina</b>Acordo {diet.routine.wake} · durmo {diet.routine.sleep}</p>
   </div>
  </section>

  <button className="list-link" onClick={onGoShopping}><ShoppingCart size={20}/><span><b>Lista de compras</b><small>{shoppingCount?`${shoppingCount} ${shoppingCount===1?'item pendente':'itens pendentes'}`:'Vazia por enquanto'}</small></span><ArrowRight size={18}/></button>
 </div>;
}
