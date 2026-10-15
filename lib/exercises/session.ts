import {DAYS,FOCI,REGIONS,type DayKey,type ExerciseProfile,type Focus,type Session} from '../types';
import {EXERCISES,FOCUS_CATEGORIES,getExercise,type Exercise} from './library';

// ---------- Segurança: o que pode entrar no treino de cada pessoa ----------
const regionLabel=(r:string)=>REGIONS.find(x=>x.key===r)?.label.toLowerCase()||r;
const ALWAYS_AT_HOME=new Set(['nenhum','parede','cadeira','tapete']);

// Devolve o motivo do bloqueio (mostrado na biblioteca) ou null se o exercício pode ser usado.
export function blockReason(ex:Exercise,p:ExerciseProfile):string|null{
 if(p.clearance==='nao_respondido')return 'Responda às perguntas de segurança antes de treinar.';
 if(p.clearance==='recuperacao')return 'Sem liberação profissional para treinar agora.';
 if(ex.needsClearance&&p.clearance!=='liberado')return 'Exige liberação profissional para atividade física.';
 if(p.clearance==='nao_sei'&&ex.level!=='leve')return 'Enquanto não houver liberação, só exercícios leves.';
 if(p.limits.includes('coracao')&&ex.level!=='leve')return 'Com restrição cardíaca ou de pressão, só exercícios leves.';
 if(p.pain&&ex.level==='intenso')return 'Com dor atual, nada de alta intensidade.';
 const hit=ex.loads.find(r=>p.limits.includes(r));
 if(hit)return `Usa a região que você marcou: ${regionLabel(hit)}.`;
 if(!ALWAYS_AT_HOME.has(ex.equipment)&&!p.equipment.includes(ex.equipment as never))return 'Precisa de equipamento que você não marcou.';
 return null;
}
export const allowedExercises=(p:ExerciseProfile)=>EXERCISES.filter(e=>!blockReason(e,p));
export const canTrain=(p:ExerciseProfile)=>p.clearance==='liberado'||p.clearance==='nao_sei';

// ---------- Montagem da sessão ----------
export type Step={kind:'aquecimento'|'exercicio'|'descanso'|'volta',title:string,seconds:number,exerciseId?:string,reps?:string,effort?:string,note?:string};
export type BuiltSession={title:string,focus:Focus,minutes:number,steps:Step[],warnings:string[]};

const sec=(m:number)=>Math.round(m*60);
function cardioProtocol(kind:'esteira'|'bicicleta',minutes:number,allowed:Set<string>,level:ExerciseProfile['level']):BuiltSession{
 const prefix=kind==='esteira'?'esteira':'bike';
 const pick=kind==='esteira'?(allowed.has('esteira-intervalada')&&level==='intermediario'&&minutes>=20?'esteira-intervalada':allowed.has('esteira-inclinada')&&minutes>=15?'esteira-inclinada':'esteira-caminhada')
  :(allowed.has('bike-intervalado')&&level==='intermediario'&&minutes>=20?'bike-intervalado':allowed.has('bike-progressivo')&&minutes>=15?'bike-progressivo':'bike-leve');
 const ex=getExercise(pick)!;
 const warm=minutes>=20?5:3,cool=minutes>=20?5:2,main=minutes-warm-cool;
 const steps:Step[]=[{kind:'aquecimento',title:'Aquecimento leve',seconds:sec(warm),exerciseId:pick,effort:'Esforço 3 de 10'}];
 if(pick.endsWith('intervalada')||pick.endsWith('intervalado')){
  const [on,off]=prefix==='esteira'?[1,2]:[0.5,1.5];
  let left=main;while(left>=on+off){steps.push({kind:'exercicio',title:prefix==='esteira'?'Trote leve':'Pedal mais forte',seconds:sec(on),exerciseId:pick,effort:'Esforço 6 a 7 de 10'},{kind:'exercicio',title:prefix==='esteira'?'Caminhada':'Pedal leve',seconds:sec(off),exerciseId:pick,effort:'Esforço 3 a 4 de 10'});left-=on+off}
  if(left>0.2)steps.push({kind:'exercicio',title:'Ritmo leve',seconds:sec(left),exerciseId:pick,effort:'Esforço 3 a 4 de 10'});
 }else if(pick==='esteira-inclinada'){
  let left=main,i=0;while(left>0.2){const m=Math.min(i%2?2:3,left);steps.push({kind:'exercicio',title:i%2?'Plano':'Inclinação leve (2 a 5%)',seconds:sec(m),exerciseId:pick,effort:i%2?'Esforço 4 de 10':'Esforço 5 a 6 de 10'});left-=m;i++}
 }else if(pick==='bike-progressivo'){
  let left=main,i=0;while(left>0.2){const m=Math.min(5,left);steps.push({kind:'exercicio',title:`Bloco ${i+1}: aumente um pouco a carga`,seconds:sec(m),exerciseId:pick,effort:`Esforço ${Math.min(4+i,6)} de 10`});left-=m;i++}
 }else steps.push({kind:'exercicio',title:'Ritmo constante',seconds:sec(main),exerciseId:pick,effort:'Esforço 4 a 5 de 10 (dá para conversar)'});
 steps.push({kind:'volta',title:'Volta à calma',seconds:sec(cool),exerciseId:pick,effort:'Esforço 2 a 3 de 10'});
 return {title:`${ex.name} · ${minutes} min`,focus:kind,minutes,steps,warnings:[]};
}

export function buildSession(focus:Focus,minutes:number,p:ExerciseProfile,seed=Date.now()):BuiltSession|{error:string}{
 if(!canTrain(p))return {error:p.clearance==='recuperacao'?'Sem liberação profissional, o NutriDuo não monta treinos. Use a área de orientações.':'Responda às perguntas de segurança primeiro.'};
 const allowed=allowedExercises(p),ids=new Set(allowed.map(e=>e.id));
 if(focus==='esteira'||focus==='bicicleta'){
  if(!allowed.some(e=>e.category===focus))return {error:focus==='esteira'?'Marque a esteira nos seus equipamentos (ou ela está bloqueada pelas suas limitações).':'Marque a bicicleta ergométrica nos seus equipamentos (ou ela está bloqueada pelas suas limitações).'};
  return cardioProtocol(focus,minutes,ids,p.level);
 }
 const cats=FOCUS_CATEGORIES[focus];
 const pool=allowed.filter(e=>cats.includes(e.category)&&e.dose.kind!=='sessao');
 if(!pool.length)return {error:'Não há exercícios desta categoria liberados para você. Experimente mobilidade ou outra categoria.'};
 // Ordem variada mas reprodutível dentro do mesmo dia.
 const rnd=(s:string)=>{let h=seed%2147483647;for(const c of s)h=(h*31+c.charCodeAt(0))%2147483647;return h};
 const ordered=[...pool].sort((a,b)=>rnd(a.id)-rnd(b.id));
 const warmEx=allowed.filter(e=>e.id==='marcha'||e.id==='circulos-braco'||e.id==='gato-camelo');
 const coolEx=allowed.filter(e=>e.category==='mobilidade');
 const steps:Step[]=[];
 const warm=minutes>=20?3:2,cool=minutes>=20?3:2;
 const warmEach=warmEx.length?sec(warm)/Math.min(2,warmEx.length):0;
 warmEx.slice(0,2).forEach(e=>steps.push({kind:'aquecimento',title:e.name,seconds:Math.round(warmEach),exerciseId:e.id,effort:'Leve'}));
 const [work,rest]=focus==='mobilidade'?[45,10]:p.level==='iniciante'?[30,30]:[40,20];
 let left=sec(minutes-(warmEx.length?warm:0)-(focus==='mobilidade'?0:cool)),i=0;
 while(left>=work){
  const e=ordered[i%ordered.length];
  steps.push({kind:'exercicio',title:e.name,seconds:work,exerciseId:e.id,reps:e.dose.kind==='reps'?e.dose.label:undefined,note:e.dose.kind==='reps'?'Faça no seu ritmo e toque em "Concluí".':undefined});
  left-=work;
  if(left>=rest+work){steps.push({kind:'descanso',title:'Descanso',seconds:rest});left-=rest}
  i++;
 }
 if(focus!=='mobilidade')coolEx.slice(0,2).forEach(e=>steps.push({kind:'volta',title:e.name,seconds:Math.round(sec(cool)/Math.min(2,coolEx.length)),exerciseId:e.id,effort:'Alongamento leve'}));
 const warnings=p.pain?['Você marcou que sente dor: pare se ela aumentar durante o treino.']:[];
 return {title:`${FOCI.find(f=>f.key===focus)?.label} · ${minutes} min`,focus,minutes,steps,warnings};
}

// ---------- Semana de treinos e progressão ----------
const PATTERNS:Record<number,DayKey[]>={1:['qua'],2:['seg','qui'],3:['seg','qua','sex'],4:['seg','ter','qui','sex'],5:['seg','ter','qua','sex','sab'],6:['seg','ter','qua','qui','sex','sab']};
export function generateWeek(p:ExerciseProfile):ExerciseProfile['week']{
 const allowed=allowedExercises(p);
 const has=(f:Focus)=>allowed.some(e=>FOCUS_CATEGORIES[f].includes(e.category));
 const cardio:Focus=has('esteira')?'esteira':has('bicicleta')?'bicicleta':'cardio';
 const rotation=(['corpo',cardio,'pernas','core','mobilidade'] as Focus[]).filter(has);
 const days=PATTERNS[Math.min(6,Math.max(1,p.days))];
 const week:ExerciseProfile['week']={};
 let r=0;
 for(const d of DAYS.map(x=>x.key)){
  // Descanso faz parte do plano: domingo sempre livre e os focos se alternam para cada grupo muscular descansar.
  if(days.includes(d)&&rotation.length){week[d]={kind:'treino',focus:rotation[r%rotation.length],minutes:p.minutes};r++}
  else if(d!=='dom'&&has('mobilidade'))week[d]={kind:'leve',focus:'mobilidade',minutes:10};
  else week[d]={kind:'descanso',focus:'mobilidade',minutes:10};
 }
 return week;
}

export function progressionTip(sessions:Session[],p:ExerciseProfile):string|null{
 const recent=[...sessions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
 if(recent.length&&recent.slice(0,2).some(s=>s.feeling==='dificil'))return 'Os últimos treinos pareceram difíceis: mantenha o tempo atual ou reduza por uma semana. Progredir devagar também é progredir.';
 if(recent.length===3&&recent.every(s=>s.feeling==='facil')&&p.minutes<45){const next=[10,15,20,30,45].find(m=>m>p.minutes);return `Três treinos seguidos pareceram fáceis. Se continuar sem dor, que tal subir para ${next} minutos na próxima semana?`}
 return null;
}
export const localDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
