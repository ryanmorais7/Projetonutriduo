'use client';
import {useCallback,useEffect,useState} from 'react';
import type {PersonId} from '@/lib/types';

// Preferências deste aparelho (não sincronizam): perfil ativo, tema e se a escolha de perfil aparece ao abrir.
// A escolha de perfil é conveniência de interface, não autenticação.
const KEY='nutriduo_prefs',OPEN_FLAG='nutriduo_opened';
export type Theme='auto'|'claro'|'escuro';
// O modo casal começa desligado: só combina preferências quando alguém o ativa explicitamente.
type Prefs={active:PersonId|null,askOnOpen:boolean,theme:Theme,couple:boolean,v?:number};
const DEFAULTS:Prefs={active:null,askOnOpen:false,theme:'auto',couple:false,v:3};

export function usePrefs(){
 const [prefs,setPrefs]=useState<Prefs>(DEFAULTS);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  let p=DEFAULTS;
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');p={...DEFAULTS,...raw};if(p.active!=='pessoa1'&&p.active!=='pessoa2')p.active=null;
   if(raw.v!==3)p={...p,couple:false,v:3}; // versões antigas vinham com o modo casal ligado por padrão
   // sessionStorage zera quando o sistema encerra o app; se o iOS só suspender, a escolha continua.
   if(p.askOnOpen&&!sessionStorage.getItem(OPEN_FLAG))p={...p,active:null};
  }catch{}
  setPrefs(p);setReady(true);
 },[]);
 const save=useCallback((patch:Partial<Prefs>)=>setPrefs(prev=>{const next={...prev,...patch};try{localStorage.setItem(KEY,JSON.stringify(next))}catch{}return next}),[]);
 useEffect(()=>{if(!ready)return;const el=document.documentElement;if(prefs.theme==='auto')el.removeAttribute('data-theme');else el.dataset.theme=prefs.theme==='escuro'?'dark':'light'},[prefs.theme,ready]);
 const select=useCallback((id:PersonId)=>{try{sessionStorage.setItem(OPEN_FLAG,'1')}catch{}save({active:id})},[save]);
 return {...prefs,ready,select,logout:()=>save({active:null}),setAskOnOpen:(v:boolean)=>save({askOnOpen:v}),setTheme:(t:Theme)=>save({theme:t}),setCouple:(v:boolean)=>save({couple:v})};
}
