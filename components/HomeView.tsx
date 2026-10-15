'use client';
import {Bike,CalendarDays,Check,ChefHat,Heart,LoaderCircle,Moon,Sparkles,Sun,Sunrise} from 'lucide-react';
import {dishImage} from '@/lib/catalog';
import {MEALS,type PlanEntry,type Profile,type Suggestion} from '@/lib/types';
import {MiniRecipe} from './Recipe';
import {Img} from './ui';

function greeting(){const h=new Date().getHours();return h<12?{text:'Bom dia',icon:<Sunrise size={22}/>}:h<18?{text:'Boa tarde',icon:<Sun size={22}/>}:{text:'Boa noite',icon:<Moon size={22}/>}}

export function HomeView({profile,carousel,today,isFav,onFav,onOpen,onSurprise,surprising,onIngredients,onDelivery,onPlan,onFavorites}:{
 profile:Profile,carousel:Suggestion[],today:{meal:string,entry:PlanEntry}[],isFav:(r:Suggestion)=>boolean,onFav:(r:Suggestion)=>void,onOpen:(r:Suggestion)=>void,
 onSurprise:()=>void,surprising:boolean,onIngredients:()=>void,onDelivery:()=>void,onPlan:()=>void,onFavorites:()=>void,
}){
 const g=greeting();
 const actions=[
  {label:'Tenho ingredientes',hint:'Toque, fotografe ou fale',icon:<ChefHat size={24}/>,tone:'t-green',go:onIngredients},
  {label:'Quero pedir delivery',hint:'Escolha por cards',icon:<Bike size={24}/>,tone:'t-coral',go:onDelivery},
  {label:'Montar nossa semana',hint:'Planejamento flexível',icon:<CalendarDays size={24}/>,tone:'t-lilac',go:onPlan},
  {label:'Receitas favoritas',hint:'O caderno de vocês',icon:<Heart size={24}/>,tone:'t-honey',go:onFavorites},
 ];
 return <div className="view">
  <section className="hello"><h1>{g.text}, {profile.name}! <span className="hello-icon" aria-hidden>{g.icon}</span></h1><p>Vamos escolher algo gostoso e equilibrado para hoje?</p></section>

  <section className="hero" aria-labelledby="hero-title">
   <Img src={dishImage('salada','full')} alt="Prato colorido com salada, grãos e frango" className="hero-img"/>
   <div className="hero-shade"/>
   <div className="hero-content">
    <h2 id="hero-title">O que vamos comer?</h2>
    <div className="hero-actions">
     <button className="btn primary big" onClick={onSurprise} disabled={surprising}>{surprising?<LoaderCircle className="spin" size={19}/>:<Sparkles size={19}/>}Me surpreenda</button>
     <button className="btn glass big" onClick={onIngredients}>Escolher ingredientes</button>
    </div>
   </div>
  </section>

  {today.length>0&&<section className="today-sec"><div className="sec-row"><h2 className="sec-title">Hoje no plano</h2><button className="link-btn" onClick={onPlan}>Ver semana</button></div>
   <div className="today-list">{today.map(({meal,entry})=><button key={meal} className="today-item" onClick={()=>onOpen(entry.recipe)}><span className="today-meal">{MEALS.find(m=>m.key===meal)?.label}</span><b>{entry.recipe.title}</b>{entry.done&&<span className="done-badge"><Check size={13}/>Feito</span>}</button>)}</div>
  </section>}

  <section aria-labelledby="quick-title"><h2 id="quick-title" className="sec-title">Atalhos</h2>
   <div className="quick-grid">{actions.map(a=><button key={a.label} className={`quick ${a.tone}`} onClick={a.go}><span className="quick-icon">{a.icon}</span><b>{a.label}</b><small>{a.hint}</small></button>)}</div>
  </section>

  <section aria-labelledby="moment-title"><div className="sec-row"><h2 id="moment-title" className="sec-title">Sugestões do momento</h2></div>
   <div className="carousel" role="list">{carousel.map(r=><div role="listitem" key={r.id}><MiniRecipe r={r} fav={isFav(r)} onFav={()=>onFav(r)} onOpen={()=>onOpen(r)}/></div>)}</div>
   <p className="fineprint">Receitas do caderno NutriDuo, filtradas pelas restrições cadastradas. Imagens ilustrativas.</p>
  </section>
 </div>;
}
