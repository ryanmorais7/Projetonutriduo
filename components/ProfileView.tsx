'use client';
import {useState} from 'react';
import {ArrowLeftRight,Check,Cloud,Download,LogOut,Moon,PlusSquare,RotateCcw,Share,ShieldCheck,Smartphone,Sun,SunMoon,Trash2} from 'lucide-react';
import type {SyncMode} from '@/hooks/useAppState';
import type {Theme} from '@/hooks/usePrefs';
import {AVATARS,COLORS,type ColorKey} from '@/lib/catalog';
import {DEFAULT_PROFILES} from '@/lib/normalize';
import {PEOPLE,type PersonId,type Profile,type Profiles} from '@/lib/types';
import {Avatar,Segmented,TagInput} from './ui';

const GOALS=['Recuperação de massa muscular','Alimentação equilibrada','Evolução física','Mais energia no dia','Comer mais legumes','Praticidade na rotina'];

type Props={
 profiles:Profiles,active:PersonId,setProfile:(id:PersonId,fn:(p:Profile)=>Profile)=>void,onSwitch:()=>void,onLogout:()=>void,
 askOnOpen:boolean,setAskOnOpen:(v:boolean)=>void,theme:Theme,setTheme:(t:Theme)=>void,
 sync:SyncMode,privacyReport:string[],counts:{saved:number,plan:number,shopping:number},
 clear:(what:'saved'|'plan'|'shopping')=>void,eraseAll:()=>Promise<void>,
};

function Switch({checked,onChange,label,hint}:{checked:boolean,onChange:(v:boolean)=>void,label:string,hint?:string}){
 return <button className="switch-row" role="switch" aria-checked={checked} onClick={()=>onChange(!checked)}><span><b>{label}</b>{hint&&<small>{hint}</small>}</span><span className={`switch ${checked?'on':''}`} aria-hidden><i/></span></button>;
}

export function ProfileView(p:Props){
 const [editing,setEditing]=useState<PersonId>(p.active),[confirmAll,setConfirmAll]=useState(false),[msg,setMsg]=useState('');
 const prof=p.profiles[editing];
 const set=<K extends keyof Profile>(k:K,v:Profile[K])=>p.setProfile(editing,x=>({...x,[k]:v}));
 const done=(m:string)=>{setMsg(m);setTimeout(()=>setMsg(''),2500)};
 return <div className="view">
  <section className="me-card" style={{['--card' as string]:COLORS[p.profiles[p.active].color].main}}>
   <Avatar profile={p.profiles[p.active]} size={64}/>
   <div><small>Perfil ativo neste aparelho</small><h1>{p.profiles[p.active].name}</h1></div>
   <div className="me-actions"><button className="btn soft sm" onClick={p.onSwitch}><ArrowLeftRight size={16}/>Trocar perfil</button><button className="btn ghost sm" onClick={p.onLogout}><LogOut size={16}/>Sair</button></div>
  </section>

  <section className="panel-sec"><h2 className="sec-title">Editar perfil</h2>
   <Segmented label="Perfil em edição" value={editing} onChange={setEditing} options={PEOPLE.map(id=>({value:id,label:p.profiles[id].name||id}))}/>
   <div className="form">
    <label className="field"><span>Nome</span><input value={prof.name} maxLength={40} onChange={e=>set('name',e.target.value)} autoComplete="off"/></label>
    <div className="field"><span>Avatar</span><div className="avatar-grid" role="radiogroup" aria-label="Avatar">{AVATARS.map(a=><button key={a} role="radio" aria-checked={prof.avatar===a} className={prof.avatar===a?'on':''} onClick={()=>set('avatar',a)}><span aria-hidden>{a}</span></button>)}</div></div>
    <div className="field"><span>Cor</span><div className="swatches" role="radiogroup" aria-label="Cor do perfil">{(Object.keys(COLORS) as ColorKey[]).map(c=><button key={c} role="radio" aria-checked={prof.color===c} aria-label={COLORS[c].label} className={prof.color===c?'on':''} style={{background:COLORS[c].main}} onClick={()=>set('color',c)}>{prof.color===c&&<Check size={16}/>}</button>)}</div></div>
    <label className="field"><span>Objetivo alimentar <small>do seu jeito, sem metas de peso</small></span><textarea rows={2} maxLength={160} value={prof.goal} onChange={e=>set('goal',e.target.value)} placeholder="Ex.: comer de forma equilibrada e ter mais energia"/></label>
    <div className="chip-row">{GOALS.filter(g=>!prof.goal.includes(g)).map(g=><button key={g} className="chip ghost" onClick={()=>set('goal',(prof.goal?`${prof.goal.replace(/[.\s]+$/,'')}, `:'')+g.toLowerCase().replace(/^./,c=>c.toUpperCase()).slice(0,160))}>+ {g}</button>)}</div>
    <TagInput label="Alimentos preferidos" values={prof.likes} onChange={v=>set('likes',v)} suggestions={['Frango','Ovos','Arroz e feijão','Massas','Peixe','Frutas','Saladas']}/>
    <TagInput label="Alimentos que prefere evitar" hint="preferência, sem rigor" values={prof.avoids} onChange={v=>set('avoids',v)} suggestions={['Cebola crua','Coentro','Pimenta','Fritura']}/>
    <TagInput label="Intolerâncias" hint="evitar ou usar versão sem" values={prof.intolerances} onChange={v=>set('intolerances',v)} suggestions={['Lactose','Frutose']}/>
    <TagInput label="Alergias" hint="excluídas por completo" values={prof.allergies} onChange={v=>set('allergies',v)} suggestions={['Amendoim','Castanhas','Frutos do mar','Ovo','Leite','Soja']}/>
    <Switch checked={prof.celiac} onChange={v=>set('celiac',v)} label="Doença celíaca" hint="Zero glúten e cuidado com contaminação cruzada"/>
    <div className="field"><span>Tempo para cozinhar</span><Segmented label="Tempo para cozinhar" value={prof.cookTime} onChange={v=>set('cookTime',v)} options={[{value:'rapido',label:'Pouco'},{value:'medio',label:'Médio'},{value:'sem_pressa',label:'Sem pressa'}]}/></div>
    <div className="field"><span>Refeições por dia</span><Segmented label="Refeições por dia" value={prof.meals} onChange={v=>set('meals',v)} options={['2','3','4','5+'].map(v=>({value:v as Profile['meals'],label:v}))}/></div>
    <div className="field"><span>Orçamento</span><Segmented label="Orçamento" value={prof.budget} onChange={v=>set('budget',v)} options={[{value:'economico',label:'Econômico'},{value:'moderado',label:'Moderado'},{value:'livre',label:'Livre'}]}/></div>
    <div className="field"><span>Estilo de refeição</span><Segmented label="Estilo" value={prof.style} onChange={v=>set('style',v)} options={[{value:'simples',label:'Simples'},{value:'elaborado',label:'Elaborado'}]}/></div>
    <details className="private-box"><summary><ShieldCheck size={17}/>Dados corporais (opcional e privado)</summary>
     <p className="fineprint">Só são usados nas sugestões se você ligar a opção abaixo. Nunca viram metas de peso ou calorias.</p>
     <div className="row-2"><label className="field"><span>Peso</span><input inputMode="decimal" value={prof.body.weight} maxLength={10} onChange={e=>set('body',{...prof.body,weight:e.target.value})} placeholder="kg"/></label><label className="field"><span>Altura</span><input inputMode="decimal" value={prof.body.height} maxLength={10} onChange={e=>set('body',{...prof.body,height:e.target.value})} placeholder="cm"/></label></div>
     <label className="field"><span>Atividade física</span><input value={prof.body.activity} maxLength={80} onChange={e=>set('body',{...prof.body,activity:e.target.value})} placeholder="Ex.: musculação 3x por semana"/></label>
     <Switch checked={prof.useBody} onChange={v=>set('useBody',v)} label="Usar para ajustar porções" hint="Desligado: esses dados não saem do app"/>
    </details>
    <label className="field"><span>Observações para as sugestões <small>opcional</small></span><textarea rows={2} maxLength={400} value={prof.notes} onChange={e=>set('notes',e.target.value)} placeholder="Ex.: gosto de comida bem temperada"/></label>
    <button className="btn ghost" onClick={()=>{if(confirm(`Apagar os dados do perfil de ${prof.name} e voltar ao padrão?`)){p.setProfile(editing,()=>DEFAULT_PROFILES[editing]);done('Perfil redefinido.')}}}><RotateCcw size={16}/>Apagar dados deste perfil</button>
   </div>
  </section>

  <section className="panel-sec"><h2 className="sec-title">Neste aparelho</h2>
   <Switch checked={p.askOnOpen} onChange={p.setAskOnOpen} label="Perguntar o perfil ao abrir" hint="Funciona quando o sistema fecha o app de verdade. No iPhone, se o app só ficar em segundo plano, a escolha continua."/>
   <div className="field"><span>Aparência</span><Segmented label="Tema" value={p.theme} onChange={p.setTheme} options={[{value:'auto',label:'Automático',icon:<SunMoon size={16}/>},{value:'claro',label:'Claro',icon:<Sun size={16}/>},{value:'escuro',label:'Escuro',icon:<Moon size={16}/>}]}/></div>
  </section>

  <section className="panel-sec install"><h2 className="sec-title"><Download size={18}/>Instalar no iPhone</h2>
   <ol className="install-steps">
    <li><span className="step-ico"><Smartphone size={18}/></span><span>Abra o NutriDuo no <b>Safari</b>.</span></li>
    <li><span className="step-ico"><Share size={18}/></span><span>Toque em <b>Compartilhar</b> (o quadrado com a seta).</span></li>
    <li><span className="step-ico"><PlusSquare size={18}/></span><span>Escolha <b>Adicionar à Tela de Início</b> (pode estar em “Mais”).</span></li>
    <li><span className="step-ico"><Check size={18}/></span><span>Abra pelo ícone: ele roda em tela cheia, como um app.</span></li>
   </ol>
   <p className="fineprint">É um app web (PWA): não tem notificações nativas nem acesso a recursos exclusivos da App Store.</p>
  </section>

  <section className="panel-sec"><h2 className="sec-title"><ShieldCheck size={18}/>Privacidade e dados</h2>
   <p className="store-line">{p.sync==='nuvem'?<><Cloud size={16}/>Perfis, favoritas, plano e lista ficam no banco do app (Neon) e aparecem nos aparelhos de vocês.</>:<><Smartphone size={16}/>Seus dados estão salvos só neste aparelho.</>}</p>
   {p.privacyReport.length>0&&<div className="report"><b>Removido automaticamente na atualização:</b><ul>{p.privacyReport.map(r=><li key={r}>{r}</li>)}</ul></div>}
   <ul className="data-list">
    <li><span>Favoritas<small>{p.counts.saved} receitas</small></span><button className="btn ghost sm" disabled={!p.counts.saved} onClick={()=>{if(confirm('Apagar todas as favoritas? Some dos dois aparelhos.')){p.clear('saved');done('Favoritas apagadas.')}}}><Trash2 size={15}/>Apagar</button></li>
    <li><span>Plano da semana<small>{p.counts.plan} refeições</small></span><button className="btn ghost sm" disabled={!p.counts.plan} onClick={()=>{if(confirm('Limpar o plano da semana?')){p.clear('plan');done('Plano limpo.')}}}><Trash2 size={15}/>Limpar</button></li>
    <li><span>Lista de compras<small>{p.counts.shopping} itens</small></span><button className="btn ghost sm" disabled={!p.counts.shopping} onClick={()=>{if(confirm('Limpar a lista de compras?')){p.clear('shopping');done('Lista limpa.')}}}><Trash2 size={15}/>Limpar</button></li>
   </ul>
   <p className="fineprint">Fotos e áudios são enviados à IA (OpenAI) só quando você toca no botão, e não ficam salvos no app. Pela política da OpenAI, dados enviados à API podem ser retidos por até 30 dias para segurança, sem uso em treinamento.</p>
   {!confirmAll?<button className="btn danger full" onClick={()=>setConfirmAll(true)}><Trash2 size={17}/>Apagar todos os dados do app</button>:
    <div className="confirm-box" role="alertdialog" aria-label="Confirmar exclusão"><p>Isso apaga perfis, favoritas, plano e lista{p.sync==='nuvem'?' do banco e de todos os aparelhos':' deste aparelho'}. Não dá para desfazer.</p><div className="row-actions"><button className="btn ghost" onClick={()=>setConfirmAll(false)}>Cancelar</button><button className="btn danger" onClick={async()=>{try{await p.eraseAll();setConfirmAll(false);done('Tudo apagado.')}catch(e){done(e instanceof Error?e.message:'Não consegui apagar.')}}}>Apagar tudo</button></div></div>}
   {msg&&<p className="ok-note" role="status"><Check size={15}/>{msg}</p>}
  </section>
 </div>;
}
