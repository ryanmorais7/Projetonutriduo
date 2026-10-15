'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {CalendarPlus,Check,Info,LoaderCircle,Plus,RefreshCw,Shuffle,Sparkles} from 'lucide-react';
import {DietView} from '@/components/DietView';
import {ExercisesView,type ExRequest} from '@/components/ExercisesView';
import {ExploreView,type Budget,type CardHandlers,type Craving,type ExploreMode,type Selected} from '@/components/Explore';
import {FavoritesView} from '@/components/FavoritesView';
import {HomeView} from '@/components/HomeView';
import {Onboarding} from '@/components/Onboarding';
import {PlanView,todayKey} from '@/components/PlanView';
import {ProfilePicker} from '@/components/ProfilePicker';
import {ProfileView} from '@/components/ProfileView';
import {RecipeCard,RecipeDetail} from '@/components/Recipe';
import {BottomNav,CoupleToggle,TopBar,type Tab} from '@/components/Shell';
import {Segmented,Sheet,SkeletonCards} from '@/components/ui';
import {useAppState} from '@/hooks/useAppState';
import {useLibrary} from '@/hooks/useLibrary';
import {usePrefs} from '@/hooks/usePrefs';
import {canTrain,localDate} from '@/lib/exercises/session';
import {COLORS,norm} from '@/lib/catalog';
import {uid} from '@/lib/normalize';
import {aiPersonFrom,personalFilter} from '@/lib/personal';
import {compatibility} from '@/lib/restrictions';
import {mealNow} from '@/lib/time';
import {COUPLE_FIELDS,DAYS,MEALS,slotKey,type CoupleFood,type DayKey,type ForWho,type Intent,type MealKey,type PersonId,type SuggestRequest,type SuggestResponse,type Suggestion} from '@/lib/types';
import {api} from '@/services/api';

type Results={open:boolean,loading:boolean,more:boolean,error:string,data:SuggestResponse|null,req:SuggestRequest|null,title:string};
const CLOSED:Results={open:false,loading:false,more:false,error:'',data:null,req:null,title:''};
const ALL_SLOTS=DAYS.flatMap(d=>MEALS.map(m=>slotKey(d.key,m.key)));
const sameRecipe=(a:Suggestion,b:Suggestion)=>a.id===b.id||(!!a.recipeId&&a.recipeId===b.recipeId)||norm(a.title)===norm(b.title);

export default function App(){
 const prefs=usePrefs();
 const active=prefs.active;
 const app=useAppState(active,prefs.couple);
 const {pub,data,partnerFood}=app;
 const other:PersonId=active==='pessoa2'?'pessoa1':'pessoa2';
 const [tab,setTab]=useState<Tab>('inicio'),[exploreMode,setExploreMode]=useState<ExploreMode>('receitas');
 const [planDay,setPlanDay]=useState<DayKey|undefined>(),[planTab,setPlanTab]=useState<'semana'|'compras'|undefined>();
 const [selected,setSelected]=useState<Selected[]>([]),[hunger,setHunger]=useState<Record<PersonId,number>>({pessoa1:2,pessoa2:2}),[time,setTime]=useState<'rapido'|'normal'>('rapido');
 const [results,setResults]=useState<Results>(CLOSED),[swapping,setSwapping]=useState(''),[recent,setRecent]=useState<Suggestion[]>([]);
 const [detail,setDetail]=useState<Suggestion|null>(null),[planTarget,setPlanTarget]=useState<Suggestion|null>(null),[toast,setToast]=useState('');
 const [online,setOnline]=useState(true),[mealOverride,setMealOverride]=useState<MealKey|null>(null),[busyIntent,setBusyIntent]=useState<Intent|null>(null),[generating,setGenerating]=useState(false);
 const [onboard,setOnboard]=useState<{open:boolean,key:number,startAt:number}>({open:false,key:0,startAt:0});
 const [carousel,setCarousel]=useState<Suggestion[]>([]),[carouselLoading,setCarouselLoading]=useState(false),[exRequest,setExRequest]=useState<ExRequest|null>(null);

 useEffect(()=>{
  setOnline(navigator.onLine);const on=()=>setOnline(true),off=()=>setOnline(false);
  window.addEventListener('online',on);window.addEventListener('offline',off);
  if('serviceWorker' in navigator&&process.env.NODE_ENV==='production')navigator.serviceWorker.register('/sw.js').catch(()=>{});
  return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)};
 },[]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3200);return()=>clearTimeout(t)},[toast]);
 useEffect(()=>{if(!active)return;const c=COLORS[pub[active].color];const s=document.documentElement.style;s.setProperty('--accent',c.main);s.setProperty('--accent-soft',c.soft)},[active,pub]);
 // Ao trocar de perfil, nada da sessão anterior continua na tela.
 useEffect(()=>{setResults(CLOSED);setDetail(null);setRecent([]);setSelected([]);setMealOverride(null);setTab('inicio')},[active]);

 const couple=prefs.couple&&!!partnerFood;
 const forWho:ForWho=couple||!active?'ambos':active;
 const myFood=useMemo(()=>data?Object.fromEntries(COUPLE_FIELDS.map(k=>[k,data.diet[k]])) as CoupleFood:null,[data]);
 const peopleFood=useMemo(()=>myFood?[{...myFood,hidden:data!.diet.hidden},...(couple&&partnerFood?[partnerFood]:[])]:[],[myFood,couple,partnerFood,data]);
 const personal=useMemo(()=>personalFilter(peopleFood),[peopleFood]);
 const lib=useLibrary(personal,selected.map(s=>s.name));
 const meal:MealKey=mealOverride??mealNow(data?.diet.routine);
 const trainedToday=!!data?.sessions.some(s=>s.date===localDate());

 // Carrossel do início: receitas do catálogo para a refeição do momento (muda a cada dia).
 const personalKey=JSON.stringify(personal);
 useEffect(()=>{
  if(!active||!data)return;let alive=true;setCarouselLoading(true);
  api.recipes({meal,pageSize:8,page:0,personal}).then(r=>{if(alive)setCarousel(r.items)}).catch(()=>{}).finally(()=>{if(alive)setCarouselLoading(false)});
  return()=>{alive=false};
 },[active,meal,personalKey,!!data]);// eslint-disable-line react-hooks/exhaustive-deps

 const saved=data?.saved||[],later=data?.later||[],plan=data?.plan||{},shopping=data?.shopping||[];
 const isFav=useCallback((r:Suggestion)=>saved.some(s=>sameRecipe(s,r)),[saved]);
 const isLater=useCallback((r:Suggestion)=>later.some(s=>sameRecipe(s,r)),[later]);
 const toggleFav=(r:Suggestion)=>{const on=isFav(r);app.update('saved',s=>on?s.filter(x=>!sameRecipe(x,r)):[r,...s].slice(0,200));setToast(on?'Removida das favoritas.':'Guardada nas favoritas.')};
 const toggleLater=(r:Suggestion)=>{const on=isLater(r);app.update('later',s=>on?s.filter(x=>!sameRecipe(x,r)):[r,...s].slice(0,100));setToast(on?'Removida de “para depois”.':'Salva para depois.')};
 const people=active?[{id:active,name:pub[active].name},...(couple?[{id:other,name:pub[other].name}]:[])]:[];
 const compatPeople=myFood&&active?[{name:pub[active].name,diet:myFood},...(couple&&partnerFood?[{name:pub[other].name,diet:partnerFood}]:[])]:[];
 const cards:CardHandlers={
  isFav,toggleFav,isLater,toggleLater,open:setDetail,
  dislike:r=>{if(!r.recipeId)return;app.update('diet',d=>({...d,hidden:[...new Set([...d.hidden,r.recipeId!])].slice(-300)}));setToast('Não vamos mais sugerir essa receita.')},
  similar:r=>{if(!r.recipeId)return;setDetail(null);setResults(CLOSED);lib.setSimilar({id:r.recipeId,title:r.title});setExploreMode('receitas');setTab('explorar');window.scrollTo({top:0})},
  compat:r=>r.mode==='casa'&&compatPeople.length?compatibility(r,compatPeople):null,
 };
 const addShopping=(names:string[],source:string)=>{
  const have=new Set(shopping.map(i=>norm(i.name)));const fresh:string[]=[];
  for(const n of names){const t=n.trim().slice(0,80),k=norm(t);if(t&&!have.has(k)){have.add(k);fresh.push(t)}}
  if(fresh.length)app.update('shopping',s=>[...fresh.map(name=>({id:uid(),name,done:false,source:source.slice(0,120)})),...s].slice(0,300));
  return fresh.length;
 };

 const buildReq=(kind:SuggestRequest['kind'],extra:Partial<SuggestRequest>={}):SuggestRequest=>{
  const profiles:SuggestRequest['profiles']={};
  if(active&&myFood)profiles[active]=aiPersonFrom(pub[active].name,myFood,data!.diet,hunger[active]);
  if(forWho==='ambos'&&partnerFood)profiles[other]=aiPersonFrom(pub[other].name,partnerFood,undefined,hunger[other]);
  return {kind,forWho,ingredients:[],time,exclude:[...(data?.diet.hidden||[])].slice(-200),count:6,profiles,meal,trained:trainedToday,sleep:data?.diet.routine.sleep,...extra};
 };
 async function runSuggest(req:SuggestRequest,title:string){
  setResults({open:true,loading:true,more:false,error:'',data:null,req,title});
  try{const d=await api.suggest(req);setResults(r=>({...r,loading:false,data:d}));setRecent(prev=>[...d.suggestions,...prev.filter(p=>!d.suggestions.some(s=>sameRecipe(s,p)))].slice(0,18))}
  catch(e){setResults(r=>({...r,loading:false,error:e instanceof Error?e.message:'Não consegui gerar ideias.'}))}
 }
 async function moreResults(){
  if(!results.req||!results.data)return;setResults(r=>({...r,more:true}));
  try{const shown=results.data.suggestions.map(s=>s.recipeId||s.title);const d=await api.suggest({...results.req,exclude:[...results.req.exclude,...shown].slice(-300)});
   setResults(r=>r.data?{...r,more:false,data:{...r.data,suggestions:[...r.data.suggestions,...d.suggestions.filter(x=>!r.data!.suggestions.some(y=>sameRecipe(x,y)))]}}:r);
  }catch(e){setResults(r=>({...r,more:false}));setToast(e instanceof Error?e.message:'Não consegui carregar mais.')}
 }
 async function swap(r:Suggestion){
  if(!results.req||!results.data)return;setSwapping(r.id);
  try{const shown=results.data.suggestions.map(s=>s.recipeId||s.title);const d=await api.suggest({...results.req,kind:'trocar',count:1,exclude:[...results.req.exclude,...shown].slice(-300)});const next=d.suggestions[0];
   if(next)setResults(x=>x.data?{...x,data:{...x.data,suggestions:x.data.suggestions.map(s=>s.id===r.id?next:s)}}:x);
  }catch(e){setToast(e instanceof Error?e.message:'Não consegui trocar agora.')}
  finally{setSwapping('')}
 }
 // Monta/remonta refeições do cardápio a partir do catálogo, preservando todas as outras.
 // "override" recebe as restrições recém-salvas (o estado da tela ainda não foi atualizado nesse momento).
 const regenerate=async(keys:string[],override?:typeof personal):Promise<string|null>=>{
  if(!keys.length)return null;
  const pers=override||personal;
  const keep=Object.entries(plan).filter(([k])=>!keys.includes(k)).map(([,e])=>e.recipe.recipeId).filter(Boolean) as string[];
  const current=keys.map(k=>plan[k]?.recipe.recipeId).filter(Boolean) as string[];
  try{
   const r=await api.plan({slots:keys.map(k=>({key:k,meal:k.split('-')[1] as MealKey})),keep,forWho,seed:Math.floor(Math.random()*1e6),search:{personal:pers,have:selected.map(s=>s.name),exclude:current}});
   app.update('plan',p=>{const next={...p};for(const [k,s] of Object.entries(r.entries))next[k]={recipe:s,forWho,done:false};return next});
   return Object.keys(r.entries).length<keys.length?'Algumas refeições ficaram sem opção com as restrições atuais.':null;
  }catch(e){return e instanceof Error?e.message:'Não consegui montar agora.'}
 };
 const goExplore=(m:ExploreMode)=>{setExploreMode(m);setTab('explorar');window.scrollTo({top:0})};
 const goPlan=(day?:DayKey,t?:'semana'|'compras')=>{setPlanDay(day);setPlanTab(t||'semana');setTab('planejar');window.scrollTo({top:0})};

 if(!prefs.ready||!app.hydrated)return <div className="splash" aria-busy="true"><span className="brandmark pulse"/></div>;
 if(!active)return <ProfilePicker profiles={pub} onSelect={id=>{prefs.select(id);setTab('inicio')}}/>;
 if(!data)return <div className="splash" aria-busy="true"><span className="brandmark pulse"/></div>;

 const today=MEALS.map(m=>({meal:m.key,entry:plan[slotKey(todayKey(),m.key)]})).filter((x):x is {meal:MealKey,entry:NonNullable<typeof x.entry>}=>!!x.entry);
 const coupleToggle=<CoupleToggle inline on={prefs.couple} onChange={prefs.setCouple} profiles={pub}/>;
 const intentRun=async(i:Intent)=>{if(i==='casa'){goExplore('casa');return}setBusyIntent(i);await runSuggest(buildReq('horario',{intent:i}),`${MEALS.find(m=>m.key===meal)?.label}: ${({leve:'algo leve',satisfeito:'para ficar satisfeito',fome:'para muita fome',rapido:'rápido',treino:'depois do treino'} as Record<string,string>)[i]}`);setBusyIntent(null)};

 return <div className="app enter">
  <TopBar profile={pub[active]} sync={app.sync} online={online} onProfile={()=>setTab('perfil')} onFavorites={()=>setTab('favoritos')} favActive={tab==='favoritos'}/>
  {app.saveError&&<div className="alert slim" role="alert">{app.saveError}</div>}
  <main id="conteudo">
   {tab==='inicio'&&<HomeView name={pub[active].name} carousel={carousel} carouselLoading={carouselLoading} meal={meal} today={today} workout={canTrain(data.exercise)?data.exercise.week[todayKey()]:undefined}
    isFav={isFav} onFav={toggleFav} onOpen={setDetail} onSurprise={()=>runSuggest(buildReq('surpresa'),'Surpresa do dia')} surprising={results.loading&&results.req?.kind==='surpresa'}
    onCook={()=>goExplore('casa')} onDiet={()=>setTab('dieta')} onTrain={()=>setTab('exercicios')} onPlan={()=>goPlan()} onExplore={()=>goExplore('receitas')} couple={coupleToggle}/>}
   {tab==='explorar'&&<ExploreView mode={exploreMode} setMode={setExploreMode} lib={lib} cards={cards} selected={selected} setSelected={setSelected} hunger={hunger} setHunger={(id,v)=>setHunger(h=>({...h,[id]:v}))}
    time={time} setTime={setTime} forWho={forWho} profiles={pub} loading={results.loading} couple={coupleToggle}
    onGenerate={()=>runSuggest(buildReq('cozinhar',{ingredients:selected.map(s=>({name:s.name.slice(0,60),qty:s.qty.slice(0,30)}))}),'Ideias com o que você tem')}
    onDelivery={(c:Craving,b:Budget)=>runSuggest(buildReq('delivery',{craving:c,budget:b,count:3}),'Ideias de pedido')}/>}
   {tab==='dieta'&&<DietView name={pub[active].name} diet={data.diet} plan={plan} meal={meal} setMeal={setMealOverride} autoMeal={mealNow(data.diet.routine)} trainedToday={trainedToday} shoppingCount={shopping.filter(s=>!s.done).length}
    busyIntent={busyIntent} generating={generating} onIntent={intentRun} onOpen={setDetail}
    onOnboard={()=>setOnboard(o=>({open:true,key:o.key+1,startAt:0}))} onEditPrefs={()=>setOnboard(o=>({open:true,key:o.key+1,startAt:7}))}
    onGenerateWeek={async()=>{setGenerating(true);const err=await regenerate(ALL_SLOTS.filter(k=>!plan[k]));setGenerating(false);setToast(err||'Cardápio da semana montado.')}}
    onGoPlan={d=>goPlan(d)} onGoShopping={()=>goPlan(undefined,'compras')} couple={coupleToggle}/>}
   {tab==='exercicios'&&<ExercisesView name={pub[active].name} ex={data.exercise} setEx={fn=>app.update('exercise',fn)} sessions={data.sessions} request={exRequest}
    addSession={s=>{app.update('sessions',list=>[s,...list].slice(0,300));setToast('Treino registrado. Bom trabalho!')}}/>}
   {tab==='planejar'&&<PlanView plan={plan} setPlan={fn=>app.update('plan',fn)} profiles={pub} defaultFor={forWho} couple={couple} onOpen={setDetail} regenerate={regenerate} isFav={isFav} toggleFav={toggleFav}
    sources={[{label:'Favoritas',items:saved},{label:'Para depois',items:later},{label:'Últimas ideias',items:recent}]}
    shopping={shopping} setShopping={fn=>app.update('shopping',fn)} addShopping={addShopping} initialDay={planDay} initialTab={planTab}
    week={data.exercise.week} canTrain={canTrain(data.exercise)} onStartWorkout={(f,m)=>{setExRequest({kind:'start',focus:f,minutes:m,n:Date.now()});setTab('exercicios')}}/>}
   {tab==='favoritos'&&<FavoritesView saved={saved} later={later} cards={cards} onExplore={()=>goExplore('receitas')}/>}
   {tab==='perfil'&&<ProfileView profile={pub[active]} setProfile={fn=>app.updatePublic(p=>({...p,[active]:fn(p[active])}))}
    onSwitch={()=>prefs.logout()} onLogout={()=>prefs.logout()} onDiet={()=>{setTab('dieta');setOnboard(o=>({open:true,key:o.key+1,startAt:data.diet.onboarded?7:0}))}}
    onSafety={()=>{setExRequest({kind:'quiz',n:Date.now()});setTab('exercicios')}} askOnOpen={prefs.askOnOpen} setAskOnOpen={prefs.setAskOnOpen} theme={prefs.theme} setTheme={prefs.setTheme}
    sync={app.sync} syncReason={app.syncReason} privacyReport={app.privacyReport} counts={{saved:saved.length,later:later.length,plan:Object.keys(plan).length,shopping:shopping.length,sessions:data.sessions.length}}
    clear={what=>app.update(what,()=>(what==='plan'?{}:[]) as never)} eraseMine={app.eraseMine}/>}
  </main>
  <BottomNav tab={tab} onTab={t=>{setTab(t);window.scrollTo({top:0})}}/>
  {toast&&<div className="toast" role="status"><Check size={16}/>{toast}</div>}

  <Onboarding key={onboard.key} open={onboard.open} initial={data.diet} name={pub[active].name} startAt={onboard.startAt} onClose={()=>setOnboard(o=>({...o,open:false}))}
   onSave={async(d,generate)=>{app.update('diet',()=>d);setOnboard(o=>({...o,open:false}));setTab('dieta');
    if(generate&&ALL_SLOTS.some(k=>!plan[k])){
     const fresh=personalFilter([{...Object.fromEntries(COUPLE_FIELDS.map(k=>[k,d[k]])) as CoupleFood,hidden:d.hidden},...(couple&&partnerFood?[partnerFood]:[])]);
     setGenerating(true);const err=await regenerate(ALL_SLOTS.filter(k=>!plan[k]),fresh);setGenerating(false);setToast(err||'Preferências salvas e cardápio montado.')}else setToast('Preferências salvas.')}}/>

  <Sheet open={results.open} onClose={()=>setResults(CLOSED)} title={results.title||'Ideias'} footer={results.data&&results.req?.kind!=='delivery'?<>
   <button className="btn soft" onClick={()=>results.req&&runSuggest({...results.req,kind:'surpresa',exclude:[...results.req.exclude,...results.data!.suggestions.map(s=>s.recipeId||s.title)].slice(-300)},'Surpresa')}><Shuffle size={17}/>Surpreenda-me</button>
   <button className="btn primary" onClick={moreResults} disabled={results.more}>{results.more?<LoaderCircle className="spin" size={17}/>:<Plus size={17}/>}Ver mais opções</button>
  </>:undefined}>
   {results.loading?<><p className="muted thinking"><Sparkles size={16}/>Pensando em opções {forWho==='ambos'?'para vocês dois':`para ${pub[active].name}`}…</p><SkeletonCards count={2}/></>:
    results.error?<div className="alert" role="alert">{results.error}<button className="btn soft sm" onClick={()=>results.req&&runSuggest(results.req,results.title)}><RefreshCw size={15}/>Tentar de novo</button></div>:
    results.data&&<>
     {results.data.intro&&<p className="lead">{results.data.intro}</p>}
     {results.data.fallback&&<p className="badge-note"><Info size={15}/>Receitas do catálogo escolhidas sem a IA (ela não respondeu agora).</p>}
     <div className="results">{results.data.suggestions.map(r=><RecipeCard key={r.id} r={r} profiles={pub} fav={isFav(r)} onFav={()=>toggleFav(r)} onOpen={()=>setDetail(r)} compat={cards.compat(r)}
      onSwap={()=>swap(r)} swapping={swapping===r.id} later={isLater(r)} onLater={()=>toggleLater(r)} onSimilar={r.recipeId?()=>cards.similar(r):undefined}
      onDislike={r.recipeId?()=>{cards.dislike(r);setResults(x=>x.data?{...x,data:{...x.data,suggestions:x.data.suggestions.filter(s=>s.id!==r.id)}}:x)}:undefined}/>)}</div>
     {results.data.tip&&<div className="tip"><b>Dica</b><p>{results.data.tip}</p></div>}
     <p className="fineprint">{results.data.notice}</p>
    </>}
  </Sheet>

  <Sheet open={!!detail} onClose={()=>setDetail(null)} title={detail?.mode==='delivery'?'Ideia de pedido':'Receita'}>
   {detail&&<RecipeDetail r={detail} people={people} couple={couple} onAddShopping={names=>addShopping(names,detail.title)} onAddToPlan={()=>setPlanTarget(detail)}
    fav={isFav(detail)} onFav={()=>toggleFav(detail)} later={isLater(detail)} onLater={()=>toggleLater(detail)} onSimilar={detail.recipeId?()=>cards.similar(detail):undefined}/>}
  </Sheet>

  <AddToPlanSheet recipe={planTarget} occupied={k=>!!plan[k]} onClose={()=>setPlanTarget(null)}
   onConfirm={(day,m)=>{if(!planTarget)return;app.update('plan',p=>({...p,[slotKey(day,m)]:{recipe:planTarget,forWho,done:false}}));setPlanTarget(null);setToast(`No cardápio: ${DAYS.find(d=>d.key===day)?.label} · ${MEALS.find(x=>x.key===m)?.label}.`)}}/>
 </div>;
}

function AddToPlanSheet({recipe,occupied,onClose,onConfirm}:{recipe:Suggestion|null,occupied:(k:string)=>boolean,onClose:()=>void,onConfirm:(d:DayKey,m:MealKey)=>void}){
 const [day,setDay]=useState<DayKey>(todayKey()),[meal,setMeal]=useState<MealKey>(mealNow());
 useEffect(()=>{if(recipe){setDay(todayKey());setMeal((recipe.category&&recipe.category!=='extra'?recipe.category:mealNow()) as MealKey)}},[recipe]);
 return <Sheet open={!!recipe} onClose={onClose} title="Adicionar ao cardápio" size="auto" footer={<button className="btn primary full" onClick={()=>onConfirm(day,meal)}><CalendarPlus size={18}/>{occupied(slotKey(day,meal))?'Substituir refeição':'Adicionar'}</button>}>
  <p className="muted">{recipe?.title}</p>
  <div className="field"><span>Dia</span><div className="chip-row">{DAYS.map(d=><button key={d.key} className={`chip ${day===d.key?'on':''}`} aria-pressed={day===d.key} onClick={()=>setDay(d.key)}>{d.short}</button>)}</div></div>
  <div className="field"><span>Refeição</span><Segmented label="Refeição" value={meal} onChange={setMeal} options={MEALS.map(m=>({value:m.key,label:m.label.replace(' da manhã','')}))}/></div>
  {occupied(slotKey(day,meal))&&<p className="fineprint">Já existe uma refeição nesse horário; ela será substituída.</p>}
 </Sheet>;
}
