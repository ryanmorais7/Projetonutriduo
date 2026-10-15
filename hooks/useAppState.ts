'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {DEFAULT_PROFILES,normalizePlan,normalizeProfiles,normalizeSaved,normalizeShopping} from '@/lib/normalize';
import type {SharedState,StateKey} from '@/lib/types';
import {api,ApiError} from '@/services/api';

const CACHE_KEY='nutriduo_state_v2',REPORT_KEY='nutriduo_privacy_report';
const OLD_KEYS=['nutriduo_profiles','nutriduo_saved','nutriduo_symptoms'];
const KEYS:StateKey[]=['profiles','saved','plan','shopping'];
export type SyncMode='carregando'|'nuvem'|'aparelho'|'erro';

const EMPTY:SharedState={profiles:DEFAULT_PROFILES,saved:[],plan:{},shopping:[]};
function normalizeSome(raw:Partial<Record<StateKey,unknown>>,removed:string[]):Partial<SharedState>{
 const out:Partial<SharedState>={};
 if(raw.profiles!==undefined)out.profiles=normalizeProfiles(raw.profiles,removed);
 if(raw.saved!==undefined)out.saved=normalizeSaved(raw.saved);
 if(raw.plan!==undefined)out.plan=normalizePlan(raw.plan);
 if(raw.shopping!==undefined)out.shopping=normalizeShopping(raw.shopping);
 return out;
}
const readJSON=(k:string)=>{try{const v=localStorage.getItem(k);return v===null?undefined:JSON.parse(v)}catch{return undefined}};

// Banco (Neon) é a fonte da verdade quando existe; o aparelho guarda uma cópia para abrir rápido e funcionar sem banco.
export function useAppState(){
 const [state,setState]=useState<SharedState>(EMPTY);
 const [sync,setSync]=useState<SyncMode>('carregando');
 const [hydrated,setHydrated]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [privacyReport,setPrivacyReport]=useState<string[]>([]);
 const last=useRef<Partial<Record<StateKey,string>>>({}),timers=useRef<Partial<Record<StateKey,ReturnType<typeof setTimeout>>>>({});

 const addReport=useCallback((items:string[])=>{if(!items.length)return;setPrivacyReport(prev=>{const next=[...new Set([...prev,...items])];try{localStorage.setItem(REPORT_KEY,JSON.stringify(next))}catch{}return next})},[]);

 const loadRemote=useCallback(async()=>{
  try{
   const raw=await api.getState();const removed:string[]=[];
   const remote=normalizeSome(raw,removed);addReport(removed);
   // Guarda o valor cru do banco: se a normalização limpou algo, a diferença é regravada já limpa.
   for(const k of KEYS)if(raw[k]!==undefined)last.current[k]=JSON.stringify(raw[k]);
   setState(s=>({...s,...remote}));setSync('nuvem');setSaveError('');
  }catch(e){setSync(prev=>e instanceof ApiError&&e.code==='no_db'?'aparelho':prev==='nuvem'?'nuvem':'erro')}
 },[addReport]);

 useEffect(()=>{
  const removed:string[]=[];let local:Partial<SharedState>={};
  const cached=readJSON(CACHE_KEY);
  if(cached&&typeof cached==='object')local=normalizeSome(cached,removed);
  else{const p=readJSON('nutriduo_profiles'),s=readJSON('nutriduo_saved');local=normalizeSome({...(p!==undefined&&{profiles:p}),...(s!==undefined&&{saved:s})},removed)}
  try{if(localStorage.getItem('nutriduo_symptoms')!==null)removed.push('Marcação de sintomas guardada pela versão anterior');OLD_KEYS.forEach(k=>localStorage.removeItem(k))}catch{}
  const report=readJSON(REPORT_KEY);if(Array.isArray(report))setPrivacyReport(report.filter(x=>typeof x==='string'));
  addReport(removed);
  setState(s=>({...s,...local}));setHydrated(true);
  loadRemote();
  const onVisible=()=>{if(document.visibilityState==='visible')loadRemote()};
  document.addEventListener('visibilitychange',onVisible);
  return()=>document.removeEventListener('visibilitychange',onVisible);
 },[addReport,loadRemote]);

 useEffect(()=>{
  if(!hydrated)return;
  try{localStorage.setItem(CACHE_KEY,JSON.stringify(state))}catch{}
  if(sync!=='nuvem')return;
  for(const k of KEYS){
   const json=JSON.stringify(state[k]);if(last.current[k]===json)continue;
   clearTimeout(timers.current[k]);
   timers.current[k]=setTimeout(async()=>{try{await api.putState({[k]:state[k]});last.current[k]=json;setSaveError('')}catch(e){setSaveError(e instanceof Error?`Não consegui salvar na nuvem: ${e.message}`:'Não consegui salvar na nuvem.')}},600);
  }
 },[state,hydrated,sync]);

 const update=useCallback(<K extends StateKey>(key:K,fn:(prev:SharedState[K])=>SharedState[K])=>setState(s=>({...s,[key]:fn(s[key])})),[]);
 const eraseAll=useCallback(async()=>{
  if(sync==='nuvem')await api.deleteState();
  last.current={};setState(EMPTY);
  try{localStorage.removeItem(CACHE_KEY);localStorage.removeItem(REPORT_KEY)}catch{}
  setPrivacyReport([]);
 },[sync]);
 return {state,update,sync,hydrated,saveError,privacyReport,eraseAll,reload:loadRemote};
}
