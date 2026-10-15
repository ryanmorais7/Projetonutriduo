'use client';
import {useState} from 'react';
import {ArrowRight,Leaf} from 'lucide-react';
import {COLORS} from '@/lib/catalog';
import {PEOPLE,type PersonId,type PublicProfiles} from '@/lib/types';
import {Avatar} from './ui';

const TAGLINE:Record<PersonId,string>={pessoa1:'Seu plano, seus treinos, suas receitas',pessoa2:'Seu plano, seus treinos, suas receitas'};

export function ProfilePicker({profiles,onSelect}:{profiles:PublicProfiles,onSelect:(id:PersonId)=>void}){
 const [leaving,setLeaving]=useState<PersonId|null>(null);
 const choose=(id:PersonId)=>{if(leaving)return;setLeaving(id);setTimeout(()=>onSelect(id),240)};
 return <div className={`picker ${leaving?'picker-out':''}`}>
  <div className="picker-brand"><span className="brandmark"><Leaf size={20}/></span><strong>nutri<span>duo</span></strong></div>
  <h1>Quem vai cozinhar hoje?</h1>
  <p>Seu cantinho saudável está prontinho. Escolha seu perfil para começar.</p>
  <div className="picker-cards">
   {PEOPLE.map(id=>{const p=profiles[id],c=COLORS[p.color];
    return <button key={id} className={`picker-card ${leaving===id?'chosen':''}`} style={{['--card' as string]:c.main}} onClick={()=>choose(id)}>
     <Avatar profile={p} size={76}/>
     <span className="picker-name">{p.name}</span>
     <span className="picker-goal">{TAGLINE[id]}</span>
     <span className="picker-cta">Entrar como {p.name}<ArrowRight size={18}/></span>
    </button>})}
  </div>
  <small className="picker-note">A escolha fica salva neste aparelho. É só um atalho de interface, não uma senha: cada perfil vê apenas os próprios dados.</small>
 </div>;
}
