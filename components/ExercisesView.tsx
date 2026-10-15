'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Activity,AlertTriangle,Bike,Check,ChevronLeft,ChevronRight,CircleCheck,ClipboardList,Dumbbell,Footprints,HeartPulse,Lock,Moon,Pause,Play,Plus,RefreshCw,ShieldCheck,SkipForward,StretchHorizontal,Timer,Trash2,TrendingUp,X,Zap} from 'lucide-react';
import {EX_CATEGORIES,EXERCISES,getExercise,type ExCategory,type Exercise} from '@/lib/exercises/library';
import {blockReason,buildSession,canTrain,generateWeek,localDate,progressionTip,type BuiltSession,type Step} from '@/lib/exercises/session';
import {uid} from '@/lib/normalize';
import {DAYS,EQUIPMENT,FOCI,REGIONS,WORKOUT_MINUTES,type ExerciseProfile,type Focus,type Session} from '@/lib/types';
import {ExerciseFigure} from './ExerciseFigure';
import {todayKey} from './PlanView';
import {Empty,Segmented,Sheet,Switch} from './ui';

const FOCUS_ICONS:Record<Focus,typeof Dumbbell>={corpo:Dumbbell,pernas:Footprints,core:Zap,cardio:HeartPulse,esteira:Activity,bicicleta:Bike,mobilidade:StretchHorizontal};
const focusLabel=(f:Focus)=>FOCI.find(x=>x.key===f)?.label||f;
const LEVEL={leve:'Leve',moderado:'Moderado',intenso:'Intenso'};
const EQUIP_LABEL:Record<Exercise['equipment'],string>={nenhum:'Sem equipamento',esteira:'Esteira',bicicleta:'Bicicleta ergométrica',cadeira:'Cadeira firme',parede:'Parede',tapete:'Tapete',garrafas:'Garrafas de água'};

// Pedidos vindos de outras telas: "Iniciar" no Planejar ou "Segurança para exercícios" no Perfil.
export type ExRequest={kind:'start',focus:Focus,minutes:number,n:number}|{kind:'quiz',n:number};

export function ExercisesView({ex,setEx,sessions,addSession,name,request}:{ex:ExerciseProfile,setEx:(fn:(e:ExerciseProfile)=>ExerciseProfile)=>void,sessions:Session[],addSession:(s:Session)=>void,name:string,request?:ExRequest|null}){
 const [quiz,setQuiz]=useState(false),[quizKey,setQuizKey]=useState(0);
 const [minutes,setMinutes]=useState(ex.minutes),[cat,setCat]=useState<ExCategory|'todos'>('todos');
 const [player,setPlayer]=useState<BuiltSession|null>(null),[detail,setDetail]=useState<Exercise|null>(null),[error,setError]=useState('');
 const openQuiz=()=>{setQuizKey(k=>k+1);setQuiz(true)};
 const start=(focus:Focus,mins:number)=>{const s=buildSession(focus,mins,ex);if('error' in s){setError(s.error);return}setError('');setPlayer(s)};
 const handled=useRef(0);
 useEffect(()=>{if(!request||handled.current===request.n)return;handled.current=request.n;if(request.kind==='quiz')openQuiz();else start(request.focus,request.minutes)},[request]);// eslint-disable-line react-hooks/exhaustive-deps
 const today=ex.week[todayKey()];
 const tip=progressionTip(sessions,ex);
 const recent=[...sessions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
 const quizSheet=<SafetyQuiz key={quizKey} open={quiz} initial={ex} onClose={()=>setQuiz(false)} onSave={e=>{setEx(()=>({...e,week:canTrain(e)?generateWeek(e):{}}));setMinutes(e.minutes);setQuiz(false)}}/>;
 const playerSheet=player&&<Player session={player} onClose={()=>setPlayer(null)} onSave={feeling=>{addSession({id:uid(),date:localDate(),title:player.title,focus:player.focus,minutes:player.minutes,exercises:[...new Set(player.steps.map(s=>s.exerciseId).filter(Boolean) as string[])],feeling});setPlayer(null)}}/>;

 if(ex.clearance==='nao_respondido')return <div className="view">
  <section className="page-head"><h1>Exercícios em casa</h1><p>Antes de montar qualquer treino, {name}, algumas perguntas rápidas de segurança.</p></section>
  <div className="safety-intro"><ShieldCheck size={30}/><div><b>Por que perguntamos?</b><p>Abdominais, pranchas, flexões e cardio intenso não são seguros para todo mundo. Suas respostas definem o que o app pode sugerir, e você pode mudar quando quiser.</p></div></div>
  <button className="btn primary big full" onClick={openQuiz}><ClipboardList size={19}/>Responder (1 minuto)</button>
  <PreviewLibrary onOpen={setDetail}/>
  {quizSheet}
  <ExerciseDetail ex={detail} profile={ex} onClose={()=>setDetail(null)} onPick={setDetail} onDo={()=>{}}/>
 </div>;

 if(ex.clearance==='recuperacao')return <div className="view">
  <section className="page-head"><h1>Exercícios</h1><p>Sem liberação profissional, o NutriDuo não monta treinos. Aqui você organiza o que seu profissional orientou.</p></section>
  <Guidance ex={ex} setEx={setEx}/>
  <button className="btn ghost full" onClick={openQuiz}><RefreshCw size={18}/>Recebi liberação: atualizar respostas</button>
  {quizSheet}
 </div>;

 return <div className="view">
  <section className="page-head"><h1>Exercícios em casa</h1><p>Treinos curtos, com progressão gradual e descanso planejado.</p></section>
  <div className={`clearance ${ex.clearance}`}>
   <ShieldCheck size={20}/><div><b>{ex.clearance==='liberado'?'Com liberação para atividade física':'Liberação não confirmada: só exercícios leves'}</b>
   <small>{ex.limits.length?`Evitando: ${ex.limits.map(l=>REGIONS.find(r=>r.key===l)?.label).join(', ')}`:'Nenhuma limitação marcada'}{ex.pain?' · com dor atual':''}</small></div>
   <button className="link-btn" onClick={openQuiz}>Atualizar</button>
  </div>
  {error&&<div className="alert" role="alert">{error}<button className="icon-btn" aria-label="Fechar aviso" onClick={()=>setError('')}><X size={16}/></button></div>}

  {today&&<div className="today-workout">{today.kind==='descanso'?<><Moon size={22}/><span><b>Hoje é dia de descanso</b><small>Descansar faz parte do progresso.</small></span></>:<><Timer size={22}/><span><b>Hoje: {today.kind==='leve'?'mobilidade leve':focusLabel(today.focus)} · {today.minutes} min</b><small>Do seu plano da semana</small></span><button className="btn primary sm" onClick={()=>start(today.focus,today.minutes)}><Play size={16}/>Iniciar</button></>}</div>}
  {tip&&<p className="context-note"><TrendingUp size={15}/>{tip}</p>}

  <section aria-labelledby="quick-title"><h2 id="quick-title" className="sec-title">Treinar agora</h2>
   <div className="cat-row" role="radiogroup" aria-label="Tempo disponível">{WORKOUT_MINUTES.map(m=><button key={m} role="radio" aria-checked={minutes===m} className={`chip ${minutes===m?'on':''}`} onClick={()=>setMinutes(m)}>{m} min</button>)}</div>
   <div className="focus-grid">{FOCI.map(f=>{const Icon=FOCUS_ICONS[f.key];const test=buildSession(f.key,minutes,ex);const blocked='error' in test;return <button key={f.key} className={`focus-card ${blocked?'blocked':''}`} onClick={()=>start(f.key,minutes)} aria-disabled={blocked}><Icon size={24}/><b>{f.label}</b><small>{blocked?'Indisponível para você':`${minutes} min`}</small></button>})}</div>
  </section>

  <WeekEditor ex={ex} setEx={setEx} onStart={start}/>

  <section aria-labelledby="lib-title"><h2 id="lib-title" className="sec-title">Biblioteca</h2>
   <div className="cat-row" role="tablist" aria-label="Categorias">{[{key:'todos' as const,label:'Todos'},...EX_CATEGORIES].map(c=><button key={c.key} role="tab" aria-selected={cat===c.key} className={`chip ${cat===c.key?'on':''}`} onClick={()=>setCat(c.key)}>{c.label}</button>)}</div>
   <div className="ex-grid">{EXERCISES.filter(e=>cat==='todos'||e.category===cat).map(e=>{const reason=blockReason(e,ex);return <button key={e.id} className={`ex-card ${reason?'locked':''}`} onClick={()=>setDetail(e)}>
    <ExerciseFigure spec={e.figure} animate={false} label={e.name}/>{reason&&<span className="lock" aria-label="Indisponível para você"><Lock size={14}/></span>}
    <b>{e.name}</b><small>{LEVEL[e.level]} · {e.dose.label}</small></button>})}</div>
  </section>

  <section aria-labelledby="hist-title"><h2 id="hist-title" className="sec-title">Treinos concluídos</h2>
   {recent.length?<ul className="history">{recent.map(s=><li key={s.id}><CircleCheck size={18}/><span><b>{s.title}</b><small>{new Date(s.date+'T12:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})}{s.feeling&&` · ${{facil:'pareceu fácil',ok:'na medida',dificil:'pareceu difícil'}[s.feeling]}`}</small></span></li>)}</ul>:<Empty icon={<Dumbbell size={26}/>} title="Nenhum treino ainda" text="Quando concluir um treino, ele aparece aqui e ajuda nas sugestões de refeição do dia."/>}
  </section>

  {quizSheet}{playerSheet}
  <ExerciseDetail ex={detail} profile={ex} onClose={()=>setDetail(null)} onPick={setDetail} onDo={e=>{setDetail(null);setPlayer({title:e.name,focus:e.category==='bicicleta'?'bicicleta':e.category==='esteira'?'esteira':e.category==='mobilidade'?'mobilidade':e.category==='core'?'core':e.category==='pernas'?'pernas':e.category==='cardio'?'cardio':'corpo',minutes:3,warnings:[],steps:[1,2,3].flatMap(i=>[{kind:'exercicio' as const,title:`${e.name} · série ${i}`,seconds:e.dose.kind==='tempo'?e.dose.value:40,exerciseId:e.id,reps:e.dose.kind==='reps'?e.dose.label:undefined},...(i<3?[{kind:'descanso' as const,title:'Descanso',seconds:30}]:[])])})}}/>
 </div>;
}

function PreviewLibrary({onOpen}:{onOpen:(e:Exercise)=>void}){
 return <section><h2 className="sec-title">Conheça a biblioteca</h2><div className="ex-grid">{EXERCISES.slice(0,6).map(e=><button key={e.id} className="ex-card" onClick={()=>onOpen(e)}><ExerciseFigure spec={e.figure} animate={false} label={e.name}/><b>{e.name}</b><small>{LEVEL[e.level]}</small></button>)}</div></section>;
}

function WeekEditor({ex,setEx,onStart}:{ex:ExerciseProfile,setEx:(fn:(e:ExerciseProfile)=>ExerciseProfile)=>void,onStart:(f:Focus,m:number)=>void}){
 const options=[{v:'descanso',l:'Descanso'},{v:'leve',l:'Mobilidade leve'},...FOCI.map(f=>({v:f.key,l:f.label}))];
 const setDay=(d:string,v:string)=>setEx(e=>({...e,week:{...e.week,[d]:v==='descanso'?{kind:'descanso',focus:'mobilidade',minutes:10}:v==='leve'?{kind:'leve',focus:'mobilidade',minutes:10}:{kind:'treino',focus:v as Focus,minutes:e.minutes}}}));
 return <section aria-labelledby="week-ex-title">
  <div className="sec-row"><h2 id="week-ex-title" className="sec-title">Minha semana de treinos</h2><button className="link-btn" onClick={()=>setEx(e=>({...e,week:generateWeek(e)}))}><RefreshCw size={15}/>Refazer</button></div>
  <ul className="week-ex">{DAYS.map(d=>{const w=ex.week[d.key];const val=!w||w.kind==='descanso'?'descanso':w.kind==='leve'?'leve':w.focus;return <li key={d.key} className={d.key===todayKey()?'today':''}>
   <b>{d.short}</b>
   <select aria-label={`Treino de ${d.label}`} value={val} onChange={e=>setDay(d.key,e.target.value)}>{options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
   {w&&w.kind!=='descanso'?<button className="icon-btn" aria-label={`Iniciar treino de ${d.label}`} onClick={()=>onStart(w.focus,w.minutes)}><Play size={17}/></button>:<span className="icon-btn" aria-hidden><Moon size={16}/></span>}
  </li>})}</ul>
  <p className="fineprint">{ex.days} {ex.days===1?'dia':'dias'} de treino de {ex.minutes} min, domingo livre e focos alternados para os músculos descansarem.</p>
 </section>;
}

function ExerciseDetail({ex,profile,onClose,onPick,onDo}:{ex:Exercise|null,profile:ExerciseProfile,onClose:()=>void,onPick:(e:Exercise)=>void,onDo:(e:Exercise)=>void}){
 if(!ex)return null;
 const reason=blockReason(ex,profile);const easier=ex.easier?getExercise(ex.easier):undefined;
 return <Sheet open onClose={onClose} title={ex.name} footer={reason?undefined:ex.dose.kind==='sessao'?undefined:<button className="btn primary full" onClick={()=>onDo(ex)}><Play size={18}/>Fazer agora (3 séries)</button>}>
  <div className="ex-demo"><ExerciseFigure spec={ex.figure} label={ex.name}/>{ex.figure.hold&&<span className="hold-tag">Posição mantida</span>}</div>
  <div className="hl-row"><span className="hl">{LEVEL[ex.level]}</span><span className="hl">{EQUIP_LABEL[ex.equipment]}</span><span className="hl">{ex.dose.label}</span></div>
  {reason&&<div className="alert"><Lock size={16}/>{reason}</div>}
  <section className="detail-sec"><h3>Como fazer</h3><ol className="steps">{ex.how.map((h,i)=><li key={i}>{h}</li>)}</ol></section>
  {ex.cautions.length>0&&<section className="detail-sec"><h3>Cuidados</h3><ul className="bullets">{ex.cautions.map((c,i)=><li key={i}>{c}</li>)}</ul></section>}
  {ex.contraindications.length>0&&<div className="caution"><AlertTriangle size={18}/><div><b>Quando evitar</b>{ex.contraindications.map((c,i)=><p key={i}>{c}</p>)}</div></div>}
  {easier&&<button className="list-link" onClick={()=>onPick(easier)}><StretchHorizontal size={20}/><span><b>Versão mais simples</b><small>{easier.name}</small></span><ChevronRight size={18}/></button>}
  {ex.dose.kind==='sessao'&&!reason&&<p className="fineprint">Sessão adaptável: use “Treinar agora” com {ex.category==='esteira'?'Esteira':'Bicicleta ergométrica'} e escolha o tempo.</p>}
  <p className="fineprint">Demonstração esquemática. Pare se sentir dor, tontura ou falta de ar fora do comum.</p>
 </Sheet>;
}

function Guidance({ex,setEx}:{ex:ExerciseProfile,setEx:(fn:(e:ExerciseProfile)=>ExerciseProfile)=>void}){
 const [text,setText]=useState('');
 const add=()=>{const t=text.trim().slice(0,200);if(!t)return;setEx(e=>({...e,guidance:[...e.guidance,{id:uid(),text:t,done:false}].slice(0,30)}));setText('')};
 return <>
  <section className="panel-sec"><h2 className="sec-title"><ClipboardList size={18}/>Orientações do meu profissional</h2>
   {ex.guidance.length?<ul className="shop-list">{ex.guidance.map(g=><li key={g.id} className={g.done?'done':''}><button className="shop-check" aria-pressed={g.done} onClick={()=>setEx(e=>({...e,guidance:e.guidance.map(x=>x.id===g.id?{...x,done:!x.done}:x)}))}><span className="box">{g.done&&<Check size={14}/>}</span><span><b>{g.text}</b></span></button><button className="icon-btn" aria-label="Remover orientação" onClick={()=>setEx(e=>({...e,guidance:e.guidance.filter(x=>x.id!==g.id)}))}><Trash2 size={16}/></button></li>)}</ul>:<p className="muted">Anote aqui o que foi orientado (ex.: “caminhar 10 minutos por dia a partir da semana 3”).</p>}
   <div className="tag-entry"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')add()}} placeholder="Nova orientação" maxLength={200} aria-label="Nova orientação"/><button className="icon-btn solid" onClick={add} disabled={!text.trim()} aria-label="Adicionar orientação"><Plus size={18}/></button></div>
   <label className="field"><span>Anotações <small>próxima consulta, dúvidas</small></span><textarea rows={2} maxLength={400} value={ex.notes} onChange={e=>setEx(x=>({...x,notes:e.target.value}))}/></label>
  </section>
  <section className="panel-sec"><h2 className="sec-title">Para conversar com o profissional</h2>
   <ul className="edu-list">
    <li><b>Perguntas úteis</b>Quando posso voltar a caminhar? Quais movimentos devo evitar e por quanto tempo? Bicicleta ou esteira estão liberadas?</li>
    <li><b>Descanso também é cuidado</b>Sono e pausas fazem parte da recuperação. Não existe “atraso” por respeitar o tempo indicado.</li>
    <li><b>Procure atendimento</b>se houver dor que piora, febre, inchaço, vermelhidão, falta de ar ou dor no peito.</li>
   </ul>
  </section>
 </>;
}

function SafetyQuiz({open,initial,onClose,onSave}:{open:boolean,initial:ExerciseProfile,onClose:()=>void,onSave:(e:ExerciseProfile)=>void}){
 const [e,setE]=useState<ExerciseProfile>(initial.clearance==='nao_respondido'?{...initial,clearance:'nao_sei'}:initial),[step,setStep]=useState(0),[text,setText]=useState('');
 const recovering=e.clearance==='recuperacao';
 const steps=recovering?['Liberação','Orientações']:['Liberação','Limitações e dor','Orientações','Equipamentos','Rotina de treino'];
 const last=steps.length-1;
 const toggle=<T extends string>(list:T[],v:T)=>list.includes(v)?list.filter(x=>x!==v):[...list,v];
 const save=()=>onSave({...e,answeredAt:new Date().toISOString()});
 const footer=<><button className="btn ghost" onClick={()=>step?setStep(step-1):onClose()}><ChevronLeft size={18}/>{step?'Voltar':'Cancelar'}</button>{step<last?<button className="btn primary" onClick={()=>setStep(step+1)}>Continuar<ChevronRight size={18}/></button>:<button className="btn primary" onClick={save}><Check size={18}/>Salvar</button>}</>;
 const guidanceStep=<><p className="muted">Se um profissional (médico, fisioterapeuta, educador físico) passou orientações, anote para não esquecer.</p>
  {e.guidance.map(g=><p key={g.id} className="tag">{g.text}<button aria-label="Remover" onClick={()=>setE(x=>({...x,guidance:x.guidance.filter(y=>y.id!==g.id)}))}><X size={14}/></button></p>)}
  <div className="tag-entry"><input value={text} maxLength={200} onChange={ev=>setText(ev.target.value)} placeholder="Ex.: evitar impacto por 2 meses" aria-label="Orientação"/><button className="icon-btn solid" aria-label="Adicionar" disabled={!text.trim()} onClick={()=>{setE(x=>({...x,guidance:[...x.guidance,{id:uid(),text:text.trim(),done:false}]}));setText('')}}><Plus size={18}/></button></div></>;
 return <Sheet open={open} onClose={onClose} title="Segurança para treinar" footer={footer}>
  <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step+1} aria-label="Progresso"><span style={{width:`${((step+1)/steps.length)*100}%`}}/></div>
  <h3 className="step-title">{steps[step]}</h3>
  {step===0&&<div className="pick-col">
   {([['liberado','Sim, tenho liberação de um profissional para atividade física'],['nao_sei','Não tenho certeza / nunca perguntei'],['recuperacao','Estou em recuperação ou aguardando liberação (ex.: após cirurgia)']] as const).map(([k,l])=><button key={k} className={`pick ${e.clearance===k?'on':''}`} aria-pressed={e.clearance===k} onClick={()=>{setE(x=>({...x,clearance:k}));setStep(0)}}><b>{l}</b></button>)}
   <p className="fineprint">Sem liberação confirmada, o app sugere só exercícios leves. Em recuperação sem liberação, não monta treinos: só ajuda a organizar as orientações recebidas.</p>
  </div>}
  {!recovering&&step===1&&<>
   <p className="muted">Marque regiões com limitação, lesão ou que pedem cuidado. Exercícios que as usam ficam fora dos seus treinos.</p>
   <div className="pick-grid">{REGIONS.map(r=><button key={r.key} className={`pick sm ${e.limits.includes(r.key)?'on':''}`} aria-pressed={e.limits.includes(r.key)} onClick={()=>setE(x=>({...x,limits:toggle(x.limits,r.key)}))}><b>{r.label}</b></button>)}</div>
   <Switch checked={e.pain} onChange={v=>setE(x=>({...x,pain:v}))} label="Sinto dor atualmente" hint="Sem alta intensidade e com aviso para parar se piorar."/>
  </>}
  {(recovering?step===1:step===2)&&guidanceStep}
  {!recovering&&step===3&&<><p className="muted">Parede, cadeira e tapete já contam como disponíveis.</p><div className="pick-grid">{EQUIPMENT.filter(q=>['esteira','bicicleta','garrafas'].includes(q.key)).map(q=><button key={q.key} className={`pick sm ${e.equipment.includes(q.key)?'on':''}`} aria-pressed={e.equipment.includes(q.key)} onClick={()=>setE(x=>({...x,equipment:toggle(x.equipment,q.key)}))}><b>{q.label}</b></button>)}</div></>}
  {!recovering&&step===4&&<div className="form">
   <div className="field"><span>Nível atual</span><Segmented label="Nível" value={e.level} onChange={v=>setE(x=>({...x,level:v}))} options={[{value:'iniciante',label:'Começando / voltando'},{value:'intermediario',label:'Já treino'}]}/></div>
   <div className="field"><span>Dias de treino por semana</span><Segmented label="Dias por semana" value={String(e.days)} onChange={v=>setE(x=>({...x,days:Number(v)}))} options={['2','3','4','5'].map(v=>({value:v,label:v}))}/></div>
   <div className="field"><span>Tempo por treino</span><div className="chip-row">{WORKOUT_MINUTES.map(m=><button key={m} className={`chip ${e.minutes===m?'on':''}`} aria-pressed={e.minutes===m} onClick={()=>setE(x=>({...x,minutes:m}))}>{m} min</button>)}</div></div>
   <p className="fineprint">Comece pelo tempo que parece fácil. O app sugere aumentar só depois de treinos confortáveis.</p>
  </div>}
 </Sheet>;
}

function Player({session,onClose,onSave}:{session:BuiltSession,onClose:()=>void,onSave:(f:Session['feeling'])=>void}){
 const [i,setI]=useState(0),[left,setLeft]=useState(session.steps[0].seconds),[running,setRunning]=useState(true),[done,setDone]=useState(false);
 const step:Step=session.steps[i],ex=step.exerciseId?getExercise(step.exerciseId):undefined,next=session.steps[i+1];
 const totalSec=useMemo(()=>session.steps.reduce((a,s)=>a+s.seconds,0),[session]);
 const elapsed=session.steps.slice(0,i).reduce((a,s)=>a+s.seconds,0)+(step.seconds-left);
 const lock=useRef<{release:()=>Promise<void>}|null>(null);
 useEffect(()=>{(navigator as Navigator&{wakeLock?:{request:(t:'screen')=>Promise<{release:()=>Promise<void>}>}}).wakeLock?.request('screen').then(l=>{lock.current=l}).catch(()=>{});return()=>{lock.current?.release().catch(()=>{})}},[]);
 const go=(to:number)=>{if(to>=session.steps.length){setDone(true);setRunning(false);return}const t=Math.max(0,to);setI(t);setLeft(session.steps[t].seconds);navigator.vibrate?.(120)};
 useEffect(()=>{if(!running||done)return;const t=setInterval(()=>setLeft(l=>l-1),1000);return()=>clearInterval(t)},[running,done]);
 useEffect(()=>{if(left<=0&&!done)go(i+1)},[left]);// eslint-disable-line react-hooks/exhaustive-deps
 const mm=(s:number)=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.max(0,s)%60).padStart(2,'0')}`;
 if(done)return <Sheet open onClose={onClose} title="Treino concluído">
  <div className="finish"><CircleCheck size={56}/><h3>Muito bem!</h3><p>{session.title}</p><p className="muted">Como foi o esforço?</p>
   <div className="pick-grid three-col">{([['facil','Fácil'],['ok','Na medida'],['dificil','Difícil']] as const).map(([k,l])=><button key={k} className="pick" onClick={()=>onSave(k)}><b>{l}</b></button>)}</div>
   <button className="link-btn" onClick={()=>onSave(null)}>Salvar sem avaliar</button></div>
 </Sheet>;
 return <Sheet open onClose={onClose} title={session.title} footer={<>
  <button className="icon-btn" onClick={()=>go(i-1)} disabled={i===0} aria-label="Etapa anterior"><ChevronLeft size={22}/></button>
  <button className="btn primary big" onClick={()=>setRunning(r=>!r)}>{running?<><Pause size={20}/>Pausar</>:<><Play size={20}/>Continuar</>}</button>
  {step.reps?<button className="btn soft" onClick={()=>go(i+1)}><Check size={18}/>Concluí</button>:<button className="icon-btn" onClick={()=>go(i+1)} aria-label="Pular etapa"><SkipForward size={22}/></button>}
 </>}>
  <div className="player-progress" aria-label={`Progresso: ${Math.round(elapsed/totalSec*100)}%`}><span style={{width:`${Math.min(100,elapsed/totalSec*100)}%`}}/></div>
  <p className="step-label">{{aquecimento:'Aquecimento',exercicio:'Exercício',descanso:'Descanso',volta:'Volta à calma'}[step.kind]} · etapa {i+1} de {session.steps.length}</p>
  {step.kind==='descanso'?<div className="rest"><Moon size={40}/><h3>Respire e descanse</h3>{next&&<p>A seguir: <b>{next.title}</b></p>}</div>:
   <div className="ex-demo big">{ex&&<ExerciseFigure spec={ex.figure} label={ex.name}/>}</div>}
  <h3 className="player-title">{step.title}</h3>
  {step.effort&&<p className="effort">{step.effort}</p>}
  {step.reps&&<p className="effort">{step.reps} · no seu ritmo</p>}
  <div className={`timer ${left<=5?'ending':''}`} role="timer" aria-live="off">{mm(left)}</div>
  {step.note&&<p className="fineprint center">{step.note}</p>}
  {session.warnings.map(w=><p key={w} className="context-note"><AlertTriangle size={15}/>{w}</p>)}
  <p className="fineprint center">Pare se sentir dor, tontura ou falta de ar fora do comum.</p>
 </Sheet>;
}
