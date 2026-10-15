'use client';
import {CalendarDays,Cloud,CloudOff,Compass,Heart,Home,Smartphone,User,Users,WifiOff} from 'lucide-react';
import type {SyncMode} from '@/hooks/useAppState';
import type {Profile,Profiles} from '@/lib/types';
import {Avatar} from './ui';

export type Tab='inicio'|'explorar'|'planejar'|'favoritos'|'perfil';
const TABS:{key:Tab,label:string,icon:typeof Home}[]=[{key:'inicio',label:'Início',icon:Home},{key:'explorar',label:'Explorar',icon:Compass},{key:'planejar',label:'Planejar',icon:CalendarDays},{key:'favoritos',label:'Favoritos',icon:Heart},{key:'perfil',label:'Perfil',icon:User}];

export function TopBar({profile,sync,online,onSwitch}:{profile:Profile,sync:SyncMode,online:boolean,onSwitch:()=>void}){
 const status=!online?{icon:<WifiOff size={14}/>,text:'Sem internet'}:sync==='nuvem'?{icon:<Cloud size={14}/>,text:'Sincronizado'}:sync==='aparelho'?{icon:<Smartphone size={14}/>,text:'Salvo no aparelho'}:sync==='erro'?{icon:<CloudOff size={14}/>,text:'Sem sincronizar'}:null;
 return <header className="topbar">
  <button className="who" onClick={onSwitch} aria-label={`Perfil ativo: ${profile.name}. Trocar perfil`}>
   <Avatar profile={profile} size={40}/><span><small>Cozinhando agora</small><strong>{profile.name}</strong></span>
  </button>
  {status&&<span className={`sync-pill ${!online||sync==='erro'?'warn':''}`} role="status">{status.icon}{status.text}</span>}
 </header>;
}

export function BottomNav({tab,onTab}:{tab:Tab,onTab:(t:Tab)=>void}){
 return <nav className="bottom-nav" aria-label="Navegação principal">{TABS.map(t=>{const Icon=t.icon;return <button key={t.key} className={tab===t.key?'current':''} aria-current={tab===t.key?'page':undefined} onClick={()=>onTab(t.key)}><Icon size={22} strokeWidth={tab===t.key?2.4:2}/><span>{t.label}</span></button>})}</nav>;
}

// Botão fixo do modo casal: liga/desliga "para nós dois" em qualquer fluxo de sugestão.
// "fab" flutua no Início; "inline" fica no topo do Explorar para não cobrir a galeria.
export function CoupleToggle({on,onChange,profiles,inline}:{on:boolean,onChange:(v:boolean)=>void,profiles:Profiles,inline?:boolean}){
 return <button className={`couple-fab ${on?'on':''} ${inline?'inline':''}`} role="switch" aria-checked={on} onClick={()=>onChange(!on)}>
  <span className="couple-avatars"><Avatar profile={profiles.pessoa1} size={26}/><Avatar profile={profiles.pessoa2} size={26}/></span>
  <Users size={16} aria-hidden/>{on?'Cozinhando para nós dois':'Cozinhar para nós dois'}
 </button>;
}
