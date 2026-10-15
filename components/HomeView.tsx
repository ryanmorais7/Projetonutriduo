'use client';
import type {ReactNode} from 'react';
import {CalendarDays,ChefHat,Check,Dumbbell,LoaderCircle,Moon,Salad,Sparkles,Sun,Sunrise} from 'lucide-react';
import {dishImage} from '@/lib/catalog';
import {FOCI,MEALS,type ExerciseProfile,type MealKey,type PlanEntry,type Suggestion} from '@/lib/types';
import {MiniRecipe} from './Recipe';
import {Img,SkeletonCards} from './ui';

function greeting(){const h=new Date().getHours();return h<12?{text:'Bom dia',icon:<Sunrise size={22}/>}:h<18?{text:'Boa tarde',icon:<Sun size={22}/>}:{text:'Boa noite',icon:<Moon size={22}/>}}

export function HomeView({name,carousel,carouselLoading,meal,today,workout,isFav,onFav,onOpen,onSurprise,surprising,onCook,onDiet,onTrain,onPlan,onExplore,couple}:{
 name:string,couple:ReactNode,carousel:Suggestion[],carouselLoading:boolean,meal:MealKey,today:{meal:string,entry:PlanEntry}[],workout:ExerciseProfile['week'][string]|undefined,
 isFav:(r:Suggestion)=>boolean,onFav:(r:Suggestion)=>void,onOpen:(r:Suggestion)=>void,onSurprise:()=>void,surprising:boolean,
 onCook:()=>void,onDiet:()=>void,onTrain:()=>void,onPlan:()=>void,onExplore:()=>void,
}){
 const g=greeting();
 const actions=[
  {label:'Preparar uma refeição',hint:'Toque, fotografe ou fale',icon:<ChefHat size={24}/>,tone:'t-green',go:onCook},
  {label:'Ver minha dieta',hint:'Sugestões para agora',icon:<Salad size={24}/>,tone:'t-coral',go:onDiet},
  {label:'Treinar em casa',hint:'Treinos de 10 a 45 min',icon:<Dumbbell size={24}/>,tone:'t-lilac',go:onTrain},
  {label:'Planejar minha semana',hint:'Cardápio e treinos',icon:<CalendarDays size={24}/>,tone:'t-honey',go:onPlan},
 ];
 return <div className="view">
  <section className="hello"><h1>{g.text}, {name}! <span className="hello-icon" aria-hidden>{g.icon}</span></h1><p>Vamos escolher algo gostoso e equilibrado para hoje?</p></section>

  <section aria-labelledby="todo-title"><h2 id="todo-title" className="sec-title">O que deseja fazer agora?</h2>
   <div className="quick-grid">{actions.map(a=><button key={a.label} className={`quick ${a.tone}`} onClick={a.go}><span className="quick-icon">{a.icon}</span><b>{a.label}</b><small>{a.hint}</small></button>)}</div>
  </section>
  {couple}

  <section className="hero" aria-labelledby="hero-title">
   <Img src={dishImage('salada','full')} alt="Prato colorido com salada, grãos e frango" className="hero-img"/>
   <div className="hero-shade"/>
   <div className="hero-content">
    <h2 id="hero-title">O que vamos comer?</h2>
    <div className="hero-actions">
     <button className="btn primary big" onClick={onSurprise} disabled={surprising}>{surprising?<LoaderCircle className="spin" size={19}/>:<Sparkles size={19}/>}Me surpreenda</button>
     <button className="btn glass big" onClick={onExplore}>Ver todas as receitas</button>
    </div>
   </div>
  </section>

  {(today.length>0||workout)&&<section className="today-sec"><div className="sec-row"><h2 className="sec-title">Hoje</h2><button className="link-btn" onClick={onPlan}>Ver semana</button></div>
   <div className="today-list">
    {today.map(({meal:m,entry})=><button key={m} className="today-item" onClick={()=>onOpen(entry.recipe)}><span className="today-meal">{MEALS.find(x=>x.key===m)?.label}</span><b>{entry.recipe.title}</b>{entry.done&&<span className="done-badge"><Check size={13}/>Feito</span>}</button>)}
    {workout&&workout.kind!=='descanso'&&<button className="today-item" onClick={onTrain}><span className="today-meal">Treino</span><b>{workout.kind==='leve'?'Mobilidade leve':FOCI.find(f=>f.key===workout.focus)?.label} · {workout.minutes} min</b></button>}
   </div>
  </section>}

  <section aria-labelledby="moment-title"><div className="sec-row"><h2 id="moment-title" className="sec-title">Sugestões para o {MEALS.find(m=>m.key===meal)?.label.toLowerCase()}</h2><button className="link-btn" onClick={onExplore}>Ver mais</button></div>
   {carouselLoading&&!carousel.length?<SkeletonCards count={2}/>:<div className="carousel" role="list">{carousel.map(r=><div role="listitem" key={r.id}><MiniRecipe r={r} fav={isFav(r)} onFav={()=>onFav(r)} onOpen={()=>onOpen(r)}/></div>)}</div>}
   <p className="fineprint">Do catálogo NutriDuo, filtradas pelas suas restrições. Muda a cada dia.</p>
  </section>
 </div>;
}
