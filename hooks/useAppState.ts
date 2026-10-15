'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {DEFAULT_PUBLIC,emptyPerson,migrateV2,normalizeDiet,normalizePerson,normalizePublic} from '@/lib/normalize';
import {COUPLE_FIELDS,PEOPLE,PERSON_KEYS,type CoupleFood,type PersonId,type PersonKey,type PersonState,type PublicProfiles} from '@/lib/types';
import {api,ApiError} from '@/services/api';

// Cada pessoa tem seu próprio cache no aparelho e suas próprias chaves no banco.
const PUB_KEY='nutriduo_v3_public',personCache=(id:PersonId)=>`nutriduo_v3_${id}`,REPORT_KEY='nutriduo_privacy_report';
const OLD_KEYS=['nutriduo_state_v2','nutriduo_profiles','nutriduo_saved','nutriduo_symptoms'];
export type SyncMode='carregando'|'nuvem'|'aparelho'|'erro';

const readJSON=(k:string)=>{try{const v=localStorage.getItem(k);return v===null?undefined:JSON.parse(v)}catch{return undefined}};
const writeJSON=(k:string,v:unknown)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const foodView=(d:PersonState['diet']):CoupleFood=>Object.fromEntries(COUPLE_FIELDS.map(k=>[k,d[k]])) as CoupleFood;

// Migra caches antigos (v1/v2, dados compartilhados) para o formato por pessoa, uma única vez.
function migrateLocal(report:string[]){
 const v2=readJSON('nutriduo_state_v2');
 const v1p=readJSON('nutriduo_profiles'),v1s=readJSON('nutriduo_saved');
 const raw=v2&&typeof v2==='object'?v2:(v1p!==undefined||v1s!==undefined)?{...(v1p!==undefined&&{profiles:v1p}),...(v1s!==undefined&&{saved:v1s})}:null;
 try{if(localStorage.getItem('nutriduo_symptoms')!==null)report.push('Marcação de sintomas guardada pela primeira versão')}catch{}
 if(raw){
  const {public:pub,persons}=migrateV2(raw as Record<string,unknown>,report);
  writeJSON(PUB_KEY,pub);
  for(const id of PEOPLE)writeJSON(personCache(id),{...emptyPerson(id),...persons[id]});
 }
 try{OLD_KEYS.forEach(k=>localStorage.removeItem(k))}catch{}
}

export function useAppState(active:PersonId|null,couple:boolean){
 const [pub,setPub]=useState<PublicProfiles>(DEFAULT_PUBLIC);
 const [me,setMe]=useState<{id:PersonId,data:PersonState}|null>(null);
 const [partnerFood,setPartnerFood]=useState<CoupleFood|null>(null);
 const [sync,setSync]=useState<SyncMode>('carregando'),[syncReason,setSyncReason]=useState('');
 const [hydrated,setHydrated]=useState(false),[saveError,setSaveError]=useState(''),[privacyReport,setPrivacyReport]=useState<string[]>([]);
 const last=useRef<Record<string,string>>({}),timers=useRef<Record<string,ReturnType<typeof setTimeout>>>({});

 useEffect(()=>{
  const report:string[]=[];migrateLocal(report);
  const prev=readJSON(REPORT_KEY);const all=[...new Set([...(Array.isArray(prev)?prev:[]),...report])];
  if(report.length)writeJSON(REPORT_KEY,all);setPrivacyReport(all);
  setPub(normalizePublic(readJSON(PUB_KEY)));setHydrated(true);
 },[]);

 const loadRemote=useCallback(async(id:PersonId)=>{
  try{
   const raw=await api.getPerson(id);const removed:string[]=[];
   if(raw.public!==undefined){last.current.public=JSON.stringify(raw.public);setPub(normalizePublic(raw.public))}
   const data=normalizePerson(raw as Record<string,unknown>,id,removed);
   for(const k of PERSON_KEYS)if(raw[k]!==undefined)last.current[`${id}:${k}`]=JSON.stringify(raw[k]);
   setMe(m=>m&&m.id===id?{id,data:{...m.data,...data}}:m);
   if(removed.length)setPrivacyReport(r=>{const all=[...new Set([...r,...removed])];writeJSON(REPORT_KEY,all);return all});
   setSync('nuvem');setSyncReason('');setSaveError('');
  }catch(e){
   const code=e instanceof ApiError?e.code:'';
   if(code==='no_db'||code==='no_private_access'){setSync('aparelho');setSyncReason(code==='no_private_access'?(e as Error).message:'')}
   else setSync(prev=>prev==='nuvem'?'nuvem':'erro');
  }
 },[]);

 // Troca de perfil: carrega SÓ os dados da pessoa ativa (aparelho primeiro, depois a nuvem).
 useEffect(()=>{
  if(!hydrated||!active)return;
  const cached=readJSON(personCache(active));
  setMe({id:active,data:{...emptyPerson(active),...normalizePerson(cached&&typeof cached==='object'?cached:{},active)}});
  setPartnerFood(null);
  loadRemote(active);
  const onVisible=()=>{if(document.visibilityState==='visible')loadRemote(active)};
  document.addEventListener('visibilitychange',onVisible);
  return()=>document.removeEventListener('visibilitychange',onVisible);
 },[active,hydrated,loadRemote]);

 // Modo casal: busca só as preferências alimentares do outro perfil, e só enquanto estiver ligado.
 useEffect(()=>{
  if(!couple||!active){setPartnerFood(null);return}
  const other:PersonId=active==='pessoa1'?'pessoa2':'pessoa1';
  let alive=true;
  (async()=>{
   if(sync==='nuvem'){try{const r=await api.getCouple(other);if(alive)setPartnerFood(r.diet?foodView(normalizeDiet(r.diet,other)):foodView(normalizeDiet(undefined,other)))}catch{}}
   else{const c=readJSON(personCache(other));if(alive)setPartnerFood(foodView(normalizeDiet(c?.diet,other)))}
  })();
  return()=>{alive=false};
 },[couple,active,sync]);

 // Salva: cache do aparelho sempre; na nuvem, só as chaves que mudaram, com o id da pessoa dona dos dados.
 useEffect(()=>{
  if(!me||me.id!==active)return;
  const {id,data}=me;writeJSON(personCache(id),data);
  if(sync!=='nuvem')return;
  for(const k of PERSON_KEYS){
   const tag=`${id}:${k}`,json=JSON.stringify(data[k]);if(last.current[tag]===json)continue;
   clearTimeout(timers.current[tag]);
   timers.current[tag]=setTimeout(async()=>{try{await api.putState({person:id,patch:{[k]:data[k]}});last.current[tag]=json;setSaveError('')}catch(e){setSaveError(e instanceof Error?`Não consegui salvar na nuvem: ${e.message}`:'Não consegui salvar na nuvem.')}},600);
  }
 },[me,active,sync]);

 const update=useCallback(<K extends PersonKey>(key:K,fn:(prev:PersonState[K])=>PersonState[K])=>setMe(m=>m?{...m,data:{...m.data,[key]:fn(m.data[key])}}:m),[]);
 const updatePublic=useCallback((fn:(p:PublicProfiles)=>PublicProfiles)=>setPub(prev=>{
  const next=fn(prev);writeJSON(PUB_KEY,next);
  if(sync==='nuvem'&&active){const json=JSON.stringify(next);if(last.current.public!==json)api.putState({person:active,public:next}).then(()=>{last.current.public=json}).catch(e=>setSaveError(e instanceof Error?e.message:'Não consegui salvar.'))}
  return next;
 }),[sync,active]);
 const eraseMine=useCallback(async()=>{
  if(!active)return;
  if(sync==='nuvem')await api.deletePerson(active);
  PERSON_KEYS.forEach(k=>delete last.current[`${active}:${k}`]);
  try{localStorage.removeItem(personCache(active))}catch{}
  setMe({id:active,data:emptyPerson(active)});
 },[active,sync]);

 const data=me&&me.id===active?me.data:null;
 return {pub,data,partnerFood,update,updatePublic,sync,syncReason,hydrated,saveError,privacyReport,eraseMine};
}
