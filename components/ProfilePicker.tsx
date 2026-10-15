'use client';
import {useState} from 'react';
import {ArrowRight,Leaf} from 'lucide-react';
import {COLORS} from '@/lib/catalog';
import {PEOPLE,type PersonId,type Profiles} from '@/lib/types';
import {Avatar} from './ui';

export function ProfilePicker({profiles,onSelect}:{profiles:Profiles,onSelect:(id:PersonId)=>void}){
 const [leaving,setLeaving]=useState<PersonId|null>(null);
 const choose=(id:PersonId)=>{if(leaving)return;setLeaving(id);setTimeout(()=>onSelect(id),240)};
 return <div className={`picker ${leaving?'picker-out':''}`}>
  <div className="picker-brand"><span className="brandmark"><Leaf size={20}/></span><strong>nutri<span>duo</span></strong></div>
  <h1>Quem vai cozinhar hoje?</h1>
  <p>Seu cantinho saudável está prontinho. Escolha seu perfil para começar.</p>
  <div className="picker-cards">
   {PEOPLE.map(id=>{const p=profiles[id],c=COLORS[p.color],name=p.name||(id==='pessoa1'?'Ryan':'Chrysalis');
    return <button key={id} className={`picker-card ${leaving===id?'chosen':''}`} style={{['--card' as string]:c.main,['--card-soft' as string]:c.soft}} onClick={()=>choose(id)}>
     <Avatar profile={p} size={76}/>
     <span className="picker-name">{name}</span>
     <span className="picker-goal">{p.goal||'Objetivos do seu jeito, quando quiser'}</span>
     <span className="picker-cta">Entrar como {name}<ArrowRight size={18}/></span>
    </button>})}
  </div>
  <small className="picker-note">A escolha fica salva neste aparelho. É só um atalho de interface, não uma senha.</small>
 </div>;
}
