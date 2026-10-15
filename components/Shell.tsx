'use client';
import {CalendarDays,Cloud,CloudOff,Compass,Dumbbell,Heart,Home,Salad,Smartphone,Users,WifiOff} from 'lucide-react';
import type {SyncMode} from '@/hooks/useAppState';
import type {PublicProfile,PublicProfiles} from '@/lib/types';
import {Avatar} from './ui';

export type Tab='inicio'|'explorar'|'dieta'|'exercicios'|'planejar'|'favoritos'|'perfil';
const NAV:{key:Tab,label:string,icon:typeof Home}[]=[{key:'inicio',label:'Início',icon:Home},{key:'explorar',label:'Explorar',icon:Compass},{key:'dieta',label:'Minha Dieta',icon:Salad},{key:'exercicios',label:'Exercícios',icon:Dumbbell},{key:'planejar',label:'Planejar',icon:CalendarDays}];

export function TopBar({profile,sync,online,onProfile,onFavorites,favActive}:{profile:PublicProfile,sync:SyncMode,online:boolean,onProfile:()=>void,onFavorites:()=>void,favActive:boolean}){
 const status=!online?{icon:<WifiOff size={14}/>,text:'Sem internet'}:sync==='nuvem'?{icon:<Cloud size={14}/>,text:'Sincronizado'}:sync==='aparelho'?{icon:<Smartphone size={14}/>,text:'No aparelho'}:sync==='erro'?{icon:<CloudOff size={14}/>,text:'Sem sincronizar'}:null;
 return <header className="topbar">
  <button className="who" onClick={onProfile} aria-label={`Perfil de ${profile.name} e configurações`}>
   <Avatar profile={profile} size={40}/><span><small>Perfil ativo</small><strong>{profile.name}</strong></span>
  </button>
  <div className="top-actions">
   {status&&<span className={`sync-pill ${!online||sync==='erro'?'warn':''}`} role="status">{status.icon}<span className="sync-text">{status.text}</span></span>}
   <button className={`icon-btn round ${favActive?'on':''}`} onClick={onFavorites} aria-label="Favoritos e salvos para depois"><Heart size={20} fill={favActive?'currentColor':'none'}/></button>
  </div>
 </header>;
}

export function BottomNav({tab,onTab}:{tab:Tab,onTab:(t:Tab)=>void}){
 return <nav className="bottom-nav" aria-label="Navegação principal">{NAV.map(t=>{const Icon=t.icon;return <button key={t.key} className={tab===t.key?'current':''} aria-current={tab===t.key?'page':undefined} onClick={()=>onTab(t.key)}><Icon size={22} strokeWidth={tab===t.key?2.4:2}/><span>{t.label}</span></button>})}</nav>;
}

// Modo casal: só quando ligado o app combina as preferências alimentares dos dois.
export function CoupleToggle({on,onChange,profiles,inline}:{on:boolean,onChange:(v:boolean)=>void,profiles:PublicProfiles,inline?:boolean}){
 return <button className={`couple-fab ${on?'on':''} ${inline?'inline':''}`} role="switch" aria-checked={on} onClick={()=>onChange(!on)}>
  <span className="couple-avatars"><Avatar profile={profiles.pessoa1} size={26}/><Avatar profile={profiles.pessoa2} size={26}/></span>
  <Users size={16} aria-hidden/>{on?'Cozinhando para nós dois':'Cozinhar para nós dois'}
 </button>;
}
