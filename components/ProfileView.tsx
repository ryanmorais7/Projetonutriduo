'use client';
import {useState} from 'react';
import {ArrowLeftRight,ArrowRight,Check,Cloud,Download,Dumbbell,LogOut,Moon,PlusSquare,Salad,Share,ShieldCheck,Smartphone,Sun,SunMoon,Trash2} from 'lucide-react';
import type {SyncMode} from '@/hooks/useAppState';
import type {Theme} from '@/hooks/usePrefs';
import {AVATARS,COLORS,type ColorKey} from '@/lib/catalog';
import type {PersonKey,PublicProfile} from '@/lib/types';
import {Avatar,Segmented,Switch} from './ui';

type Props={
 profile:PublicProfile,setProfile:(fn:(p:PublicProfile)=>PublicProfile)=>void,onSwitch:()=>void,onLogout:()=>void,
 onDiet:()=>void,onSafety:()=>void,askOnOpen:boolean,setAskOnOpen:(v:boolean)=>void,theme:Theme,setTheme:(t:Theme)=>void,
 sync:SyncMode,syncReason:string,privacyReport:string[],counts:Record<'saved'|'later'|'plan'|'shopping'|'sessions',number>,
 clear:(what:Exclude<PersonKey,'diet'|'exercise'>)=>void,eraseMine:()=>Promise<void>,
};

export function ProfileView(p:Props){
 const [confirmAll,setConfirmAll]=useState(false),[msg,setMsg]=useState('');
 const done=(m:string)=>{setMsg(m);setTimeout(()=>setMsg(''),2500)};
 const set=<K extends keyof PublicProfile>(k:K,v:PublicProfile[K])=>p.setProfile(x=>({...x,[k]:v}));
 const rows:[Exclude<PersonKey,'diet'|'exercise'>,string,string][]=[['saved','Favoritas','receitas'],['later','Para depois','receitas'],['plan','Cardápio da semana','refeições'],['shopping','Lista de compras','itens'],['sessions','Treinos registrados','treinos']];
 return <div className="view">
  <section className="me-card" style={{['--card' as string]:COLORS[p.profile.color].main}}>
   <Avatar profile={p.profile} size={64}/>
   <div><small>Perfil ativo neste aparelho</small><h1>{p.profile.name}</h1></div>
   <div className="me-actions"><button className="btn soft sm" onClick={p.onSwitch}><ArrowLeftRight size={16}/>Trocar perfil</button><button className="btn ghost sm" onClick={p.onLogout}><LogOut size={16}/>Sair</button></div>
  </section>

  <button className="list-link" onClick={p.onDiet}><Salad size={20}/><span><b>Minhas preferências alimentares</b><small>Objetivo, gostos, restrições e rotina</small></span><ArrowRight size={18}/></button>
  <button className="list-link" onClick={p.onSafety}><Dumbbell size={20}/><span><b>Segurança para exercícios</b><small>Liberação, limitações e equipamentos</small></span><ArrowRight size={18}/></button>

  <section className="panel-sec"><h2 className="sec-title">Aparência do perfil</h2>
   <div className="form">
    <label className="field"><span>Nome</span><input value={p.profile.name} maxLength={40} onChange={e=>set('name',e.target.value)} autoComplete="off"/></label>
    <div className="field"><span>Avatar</span><div className="avatar-grid" role="radiogroup" aria-label="Avatar">{AVATARS.map(a=><button key={a} role="radio" aria-checked={p.profile.avatar===a} className={p.profile.avatar===a?'on':''} onClick={()=>set('avatar',a)}><span aria-hidden>{a}</span></button>)}</div></div>
    <div className="field"><span>Cor</span><div className="swatches" role="radiogroup" aria-label="Cor do perfil">{(Object.keys(COLORS) as ColorKey[]).map(c=><button key={c} role="radio" aria-checked={p.profile.color===c} aria-label={COLORS[c].label} className={p.profile.color===c?'on':''} style={{background:COLORS[c].main}} onClick={()=>set('color',c)}>{p.profile.color===c&&<Check size={16}/>}</button>)}</div></div>
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

  <section className="panel-sec"><h2 className="sec-title"><ShieldCheck size={18}/>Privacidade e dados de {p.profile.name}</h2>
   <p className="store-line">{p.sync==='nuvem'?<><Cloud size={16}/>Seus dados ficam no banco do app, separados por pessoa. O outro perfil não vê seus dados; no modo casal, só as preferências alimentares são combinadas.</>:<><Smartphone size={16}/>Seus dados estão salvos só neste aparelho.{p.syncReason&&` ${p.syncReason}`}</>}</p>
   {p.privacyReport.length>0&&<div className="report"><b>Removido automaticamente nas atualizações:</b><ul>{p.privacyReport.map(r=><li key={r}>{r}</li>)}</ul></div>}
   <ul className="data-list">{rows.map(([k,label,unit])=><li key={k}><span>{label}<small>{p.counts[k]} {unit}</small></span><button className="btn ghost sm" disabled={!p.counts[k]} onClick={()=>{if(confirm(`Apagar ${label.toLowerCase()} de ${p.profile.name}?`)){p.clear(k);done(`${label} apagado.`)}}}><Trash2 size={15}/>Apagar</button></li>)}</ul>
   <p className="fineprint">Fotos e áudios são enviados à IA (OpenAI) só quando você toca no botão, e não ficam salvos no app. Pela política da OpenAI, dados enviados à API podem ser retidos por até 30 dias para segurança, sem uso em treinamento.</p>
   {!confirmAll?<button className="btn danger full" onClick={()=>setConfirmAll(true)}><Trash2 size={17}/>Apagar todos os meus dados</button>:
    <div className="confirm-box" role="alertdialog" aria-label="Confirmar exclusão"><p>Isso apaga a dieta, favoritas, cardápio, lista, segurança e treinos de {p.profile.name}{p.sync==='nuvem'?' no banco e neste aparelho':' neste aparelho'}. Os dados do outro perfil não são tocados. Não dá para desfazer.</p><div className="row-actions"><button className="btn ghost" onClick={()=>setConfirmAll(false)}>Cancelar</button><button className="btn danger" onClick={async()=>{try{await p.eraseMine();setConfirmAll(false);done('Seus dados foram apagados.')}catch(e){done(e instanceof Error?e.message:'Não consegui apagar.')}}}>Apagar tudo</button></div></div>}
   {msg&&<p className="ok-note" role="status"><Check size={15}/>{msg}</p>}
  </section>
 </div>;
}
