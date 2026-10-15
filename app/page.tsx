'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {CalendarPlus,Check,Heart,Info,RefreshCw,Sparkles,X} from 'lucide-react';
import {ExploreView,type Budget,type Craving,type Selected} from '@/components/Explore';
import {FavoritesView} from '@/components/FavoritesView';
import {HomeView} from '@/components/HomeView';
import {PlanView,todayKey} from '@/components/PlanView';
import {ProfilePicker} from '@/components/ProfilePicker';
import {ProfileView} from '@/components/ProfileView';
import {RecipeCard,RecipeDetail} from '@/components/Recipe';
import {BottomNav,CoupleToggle,TopBar,type Tab} from '@/components/Shell';
import {Segmented,Sheet,SkeletonCards} from '@/components/ui';
import {useAppState} from '@/hooks/useAppState';
import {usePrefs} from '@/hooks/usePrefs';
import {COLORS,norm} from '@/lib/catalog';
import {uid} from '@/lib/normalize';
import {curatedFor,mealOfDay} from '@/lib/recipes';
import {DAYS,MEALS,slotKey,type DayKey,type ForWho,type MealKey,type PersonId,type Profile,type SuggestRequest,type SuggestResponse,type Suggestion} from '@/lib/types';
import {api} from '@/services/api';

type Results={open:boolean,loading:boolean,error:string,data:SuggestResponse|null,req:SuggestRequest|null,title:string};
const CLOSED:Results={open:false,loading:false,error:'',data:null,req:null,title:''};

export default function App(){
 const app=useAppState(),prefs=usePrefs();
 const {profiles,saved,plan,shopping}=app.state;
 const [tab,setTab]=useState<Tab>('inicio'),[exploreMode,setExploreMode]=useState<'cozinhar'|'delivery'>('cozinhar');
 const [selected,setSelected]=useState<Selected[]>([]),[hunger,setHunger]=useState<Record<PersonId,number>>({pessoa1:2,pessoa2:2}),[time,setTime]=useState<'rapido'|'normal'>('rapido');
 const [results,setResults]=useState<Results>(CLOSED),[swapping,setSwapping]=useState(''),[recent,setRecent]=useState<Suggestion[]>([]);
 const [detail,setDetail]=useState<Suggestion|null>(null),[planTarget,setPlanTarget]=useState<Suggestion|null>(null),[toast,setToast]=useState('');
 const [online,setOnline]=useState(true);

 useEffect(()=>{
  setOnline(navigator.onLine);const on=()=>setOnline(true),off=()=>setOnline(false);
  window.addEventListener('online',on);window.addEventListener('offline',off);
  if('serviceWorker' in navigator&&process.env.NODE_ENV==='production')navigator.serviceWorker.register('/sw.js').catch(()=>{});
  return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)};
 },[]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3200);return()=>clearTimeout(t)},[toast]);
 // A cor do perfil ativo vira a cor de destaque do app inteiro.
 useEffect(()=>{if(!prefs.active)return;const c=COLORS[profiles[prefs.active].color];const s=document.documentElement.style;s.setProperty('--accent',c.main);s.setProperty('--accent-soft',c.soft)},[prefs.active,profiles]);

 const active=prefs.active;
 const forWho:ForWho=prefs.couple||!active?'ambos':active;
 const people=forWho==='ambos'?[profiles.pessoa1,profiles.pessoa2]:[profiles[forWho]];
 const carousel=useMemo(()=>curatedFor(people).slice(0,8),[JSON.stringify(people.map(p=>[p.avoids,p.intolerances,p.allergies,p.celiac]))]);// eslint-disable-line react-hooks/exhaustive-deps

 const isFav=useCallback((r:Suggestion)=>saved.some(s=>s.id===r.id||norm(s.title)===norm(r.title)),[saved]);
 const toggleFav=(r:Suggestion)=>{const on=isFav(r);app.update('saved',s=>on?s.filter(x=>x.id!==r.id&&norm(x.title)!==norm(r.title)):[r,...s].slice(0,200));setToast(on?'Removida das favoritas.':'Guardada nas favoritas.')};
 const addShopping=(names:string[],source:string)=>{
  const have=new Set(shopping.map(i=>norm(i.name)));const fresh:string[]=[];
  for(const n of names){const t=n.trim().slice(0,80),k=norm(t);if(t&&!have.has(k)){have.add(k);fresh.push(t)}}
  if(fresh.length)app.update('shopping',s=>[...fresh.map(name=>({id:uid(),name,done:false,source:source.slice(0,120)})),...s].slice(0,300));
  return fresh.length;
 };

 const buildReq=(kind:SuggestRequest['kind'],extra:Partial<SuggestRequest>={}):SuggestRequest=>{
  const who=extra.forWho||forWho;
  return {kind,forWho:who,ingredients:[],hunger:who==='ambos'?hunger:{[who]:hunger[who]},time,exclude:[],count:3,profiles,...extra};
 };
 async function runSuggest(req:SuggestRequest,title:string){
  setResults({open:true,loading:true,error:'',data:null,req,title});
  try{const data=await api.suggest(req);setResults(r=>({...r,loading:false,data}));setRecent(prev=>[...data.suggestions,...prev.filter(p=>!data.suggestions.some(s=>s.title===p.title))].slice(0,12))}
  catch(e){setResults(r=>({...r,loading:false,error:e instanceof Error?e.message:'Não consegui gerar ideias.'}))}
 }
 async function swap(r:Suggestion){
  if(!results.req||!results.data)return;setSwapping(r.id);
  try{const titles=results.data.suggestions.map(s=>s.title);const data=await api.suggest({...results.req,kind:'trocar',count:1,exclude:[...results.req.exclude,...titles]});const next=data.suggestions[0];
   if(next)setResults(x=>x.data?{...x,req:x.req&&{...x.req,exclude:[...x.req.exclude,r.title].slice(-30)},data:{...x.data,suggestions:x.data.suggestions.map(s=>s.id===r.id?next:s)}}:x);
  }catch(e){setToast(e instanceof Error?e.message:'Não consegui trocar agora.')}
  finally{setSwapping('')}
 }
 async function suggestFor(_day:DayKey,meal:MealKey,who:ForWho,exclude:string[]){
  try{const data=await api.suggest(buildReq('plano',{mealType:meal,forWho:who,count:1,exclude,time:'normal'}));return data.suggestions[0]||null}
  catch(e){setToast(e instanceof Error?e.message:'Não consegui sugerir agora.');return null}
 }
 const goExplore=(m:'cozinhar'|'delivery')=>{setExploreMode(m);setTab('explorar');window.scrollTo({top:0})};

 if(!prefs.ready||!app.hydrated)return <div className="splash" aria-busy="true"><span className="brandmark pulse"/></div>;
 if(!active)return <ProfilePicker profiles={profiles} onSelect={id=>{prefs.select(id);setTab('inicio')}}/>;

 const today=MEALS.map(m=>({meal:m.key,entry:plan[slotKey(todayKey(),m.key)]})).filter((x):x is {meal:MealKey,entry:NonNullable<typeof x.entry>}=>!!x.entry);

 return <div className="app enter">
  <TopBar profile={profiles[active]} sync={app.sync} online={online} onSwitch={()=>prefs.logout()}/>
  {app.saveError&&<div className="alert slim" role="alert">{app.saveError}</div>}
  <main id="conteudo">
   {tab==='inicio'&&<HomeView profile={profiles[active]} carousel={carousel} today={today} isFav={isFav} onFav={toggleFav} onOpen={setDetail}
    onSurprise={()=>runSuggest(buildReq('surpresa',{mealType:mealOfDay()}),'Surpresa do dia')} surprising={results.loading&&results.req?.kind==='surpresa'}
    onIngredients={()=>goExplore('cozinhar')} onDelivery={()=>goExplore('delivery')} onPlan={()=>setTab('planejar')} onFavorites={()=>setTab('favoritos')}/>}
   {tab==='explorar'&&<ExploreView mode={exploreMode} setMode={setExploreMode} selected={selected} setSelected={setSelected} hunger={hunger} setHunger={(id,v)=>setHunger(h=>({...h,[id]:v}))}
    time={time} setTime={setTime} forWho={forWho} profiles={profiles} loading={results.loading} couple={<CoupleToggle inline on={prefs.couple} onChange={prefs.setCouple} profiles={profiles}/>}
    onGenerate={()=>runSuggest(buildReq('cozinhar',{ingredients:selected.map(s=>({name:s.name.slice(0,60),qty:s.qty.slice(0,30)}))}),'Ideias com o que vocês têm')}
    onDelivery={(c:Craving,b:Budget)=>runSuggest(buildReq('delivery',{craving:c,budget:b}),'Ideias de pedido')}/>}
   {tab==='planejar'&&<PlanView plan={plan} setPlan={fn=>app.update('plan',fn)} profiles={profiles} defaultFor={forWho} onOpen={setDetail} suggestFor={suggestFor}
    sources={[{label:'Favoritas',items:saved},{label:'Últimas ideias',items:recent},{label:'Caderno',items:carousel}]}
    shopping={shopping} setShopping={fn=>app.update('shopping',fn)} addShopping={addShopping}/>}
   {tab==='favoritos'&&<FavoritesView saved={saved} onFav={toggleFav} onOpen={setDetail} onExplore={()=>goExplore('cozinhar')}/>}
   {tab==='perfil'&&<ProfileView profiles={profiles} active={active} setProfile={(id,fn:(p:Profile)=>Profile)=>app.update('profiles',ps=>({...ps,[id]:fn(ps[id])}))}
    onSwitch={()=>prefs.logout()} onLogout={()=>{prefs.logout();setTab('inicio')}} askOnOpen={prefs.askOnOpen} setAskOnOpen={prefs.setAskOnOpen} theme={prefs.theme} setTheme={prefs.setTheme}
    sync={app.sync} privacyReport={app.privacyReport} counts={{saved:saved.length,plan:Object.keys(plan).length,shopping:shopping.length}}
    clear={what=>app.update(what,()=>(what==='plan'?{}:[]) as never)} eraseAll={app.eraseAll}/>}
  </main>
  {tab==='inicio'&&<CoupleToggle on={prefs.couple} onChange={prefs.setCouple} profiles={profiles}/>}
  <BottomNav tab={tab} onTab={t=>{setTab(t);window.scrollTo({top:0})}}/>
  {toast&&<div className="toast" role="status"><Check size={16}/>{toast}</div>}

  <Sheet open={results.open} onClose={()=>setResults(CLOSED)} title={results.title||'Ideias'}>
   {results.loading?<><p className="muted thinking"><Sparkles size={16}/>Pensando em opções {forWho==='ambos'?'para vocês dois':`para ${profiles[forWho].name}`}…</p><SkeletonCards count={2}/></>:
    results.error?<div className="alert" role="alert">{results.error}<button className="btn soft sm" onClick={()=>results.req&&runSuggest(results.req,results.title)}><RefreshCw size={15}/>Tentar de novo</button></div>:
    results.data&&<>
     {results.data.intro&&<p className="lead">{results.data.intro}</p>}
     {results.data.fallback&&<p className="badge-note"><Info size={15}/>Sugestões do caderno NutriDuo (a IA não respondeu agora).</p>}
     <div className="results">{results.data.suggestions.map(r=><RecipeCard key={r.id} r={r} profiles={profiles} fav={isFav(r)} onFav={()=>toggleFav(r)} onOpen={()=>setDetail(r)} onSwap={()=>swap(r)} swapping={swapping===r.id}/>)}</div>
     {results.data.tip&&<div className="tip"><b>Dica</b><p>{results.data.tip}</p></div>}
     <p className="fineprint">{results.data.notice}</p>
    </>}
  </Sheet>

  <Sheet open={!!detail} onClose={()=>setDetail(null)} title={detail?.mode==='delivery'?'Ideia de pedido':'Receita'}
   footer={detail&&<button className={`btn ${isFav(detail)?'soft':'primary'} full`} onClick={()=>toggleFav(detail)}><Heart size={18} fill={isFav(detail)?'currentColor':'none'}/>{isFav(detail)?'Nas favoritas':'Favoritar'}</button>}>
   {detail&&<RecipeDetail r={detail} profiles={profiles} onAddShopping={names=>addShopping(names,detail.title)} onAddToPlan={()=>setPlanTarget(detail)}/>}
  </Sheet>

  <AddToPlanSheet recipe={planTarget} forWho={forWho} profiles={profiles} onClose={()=>setPlanTarget(null)} occupied={k=>!!plan[k]}
   onConfirm={(day,meal,who)=>{if(!planTarget)return;app.update('plan',p=>({...p,[slotKey(day,meal)]:{recipe:planTarget,forWho:who,done:false}}));setPlanTarget(null);setToast(`Adicionada em ${DAYS.find(d=>d.key===day)?.label} · ${MEALS.find(m=>m.key===meal)?.label}.`)}}/>
 </div>;
}

function AddToPlanSheet({recipe,forWho,profiles,occupied,onClose,onConfirm}:{recipe:Suggestion|null,forWho:ForWho,profiles:{pessoa1:Profile,pessoa2:Profile},occupied:(k:string)=>boolean,onClose:()=>void,onConfirm:(d:DayKey,m:MealKey,w:ForWho)=>void}){
 const [day,setDay]=useState<DayKey>(todayKey()),[meal,setMeal]=useState<MealKey>(mealOfDay()),[who,setWho]=useState<ForWho>(forWho);
 useEffect(()=>{if(recipe){setDay(todayKey());setMeal(mealOfDay());setWho(forWho)}},[recipe,forWho]);
 return <Sheet open={!!recipe} onClose={onClose} title="Adicionar ao plano" size="auto" footer={<button className="btn primary full" onClick={()=>onConfirm(day,meal,who)}><CalendarPlus size={18}/>{occupied(slotKey(day,meal))?'Substituir refeição':'Adicionar'}</button>}>
  <p className="muted">{recipe?.title}</p>
  <div className="field"><span>Dia</span><div className="chip-row">{DAYS.map(d=><button key={d.key} className={`chip ${day===d.key?'on':''}`} aria-pressed={day===d.key} onClick={()=>setDay(d.key)}>{d.short}</button>)}</div></div>
  <div className="field"><span>Refeição</span><div className="chip-row">{MEALS.map(m=><button key={m.key} className={`chip ${meal===m.key?'on':''}`} aria-pressed={meal===m.key} onClick={()=>setMeal(m.key)}>{m.label}{occupied(slotKey(day,m.key))&&<X size={12} aria-label="ocupado"/>}</button>)}</div></div>
  <div className="field"><span>Para quem</span><Segmented label="Para quem" value={who} onChange={setWho} options={[{value:'ambos',label:'Nós dois'},{value:'pessoa1',label:profiles.pessoa1.name},{value:'pessoa2',label:profiles.pessoa2.name}]}/></div>
 </Sheet>;
}
