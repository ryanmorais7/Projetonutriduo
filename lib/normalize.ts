import {AVATARS,COLORS,DISH_KEYS,norm,type DishKey} from './catalog';
import {DAYS,FOCI,GOALS,PEOPLE,REGIONS,EQUIPMENT,MEAL_CATS,planEntrySchema,sessionSchema,shoppingItemSchema,suggestionSchema,type DietProfile,type ExerciseProfile,type ForWho,type PersonId,type PersonState,type Plan,type PublicProfile,type PublicProfiles,type Session,type ShoppingItem,type Suggestion} from './types';

export const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const s=(v:unknown,max:number,f='')=>typeof v==='string'?v.trim().slice(0,max):typeof v==='number'?String(v).slice(0,max):f;
const list=(v:unknown,max:number,itemMax:number)=>Array.isArray(v)?v.map(x=>s(x,itemMax)).filter(Boolean).slice(0,max):[];
const oneOf=<T extends string>(v:unknown,opts:readonly T[],f:T):T=>opts.includes(v as T)?v as T:f;
const obj=(v:unknown)=>(v&&typeof v==='object'&&!Array.isArray(v)?v:{}) as Record<string,unknown>;
const time=(v:unknown,f:string)=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v)?v:f;

export const DEFAULT_PUBLIC:PublicProfiles={pessoa1:{name:'Ryan',avatar:'💪',color:'floresta'},pessoa2:{name:'Chrysalis',avatar:'🌸',color:'coral'}};
export const defaultDiet=(id:PersonId):DietProfile=>({
 goals:id==='pessoa1'?['massa','equilibrio']:[],goal:id==='pessoa1'?'Recuperar massa muscular com alimentação equilibrada e evolução física':'',
 likes:[],avoids:[],intolerances:[],allergies:[],celiac:false,vegetarian:false,cookTime:'medio',meals:'3',budget:'moderado',style:'simples',breakfast:'tanto_faz',
 notes:'',body:{weight:'',height:'',age:'',activity:''},useBody:false,routine:{wake:'07:00',sleep:'23:00'},onboarded:false,hidden:[],
});
export const DEFAULT_EXERCISE:ExerciseProfile={clearance:'nao_respondido',limits:[],pain:false,equipment:[],level:'iniciante',days:3,minutes:20,guidance:[],notes:'',week:{},answeredAt:''};
export const emptyPerson=(id:PersonId):PersonState=>({diet:defaultDiet(id),saved:[],later:[],plan:{},shopping:[],exercise:DEFAULT_EXERCISE,sessions:[]});

// Valores pré-preenchidos de versões antigas que expunham saúde/rotina pessoal: só eles são removidos.
const OLD_DEFAULT_NOTES=new Set(['intestino sensivel. evitar alimentos que provoquem sintomas.','recuperar massa muscular com retorno gradual aos treinos, conforme liberacao medica.']);
const OLD_DEFAULT_NAMES:Record<string,string>={eu:'Ryan','meu amor':'Chrysalis'};
const OLD_GOALS:Record<string,string>={musculo:'Apoiar recuperação muscular',equilibrio:'Comer de forma equilibrada',energia:'Ter mais energia no dia'};
const SENSITIVE=/caneta|emagrec|medica[cç][aã]o|rem[eé]dio|diarreia|dor abdominal|sintomas? (dela|persistentes|ativos)|desidrata|sangue nas fezes|desmaio/i;
export const isSensitive=(text:string)=>SENSITIVE.test(text);

export function normalizePublicOne(raw:unknown,f:PublicProfile):PublicProfile{
 const r=obj(raw);let name=s(r.name,40,f.name)||f.name;if(OLD_DEFAULT_NAMES[norm(name)])name=OLD_DEFAULT_NAMES[norm(name)];
 return {name,avatar:AVATARS.includes(s(r.avatar,16))?s(r.avatar,16):f.avatar,color:oneOf(r.color,Object.keys(COLORS) as (keyof typeof COLORS)[],f.color)};
}
export const normalizePublic=(raw:unknown):PublicProfiles=>({pessoa1:normalizePublicOne(obj(raw).pessoa1,DEFAULT_PUBLIC.pessoa1),pessoa2:normalizePublicOne(obj(raw).pessoa2,DEFAULT_PUBLIC.pessoa2)});

export function normalizeDiet(raw:unknown,id:PersonId,removed?:string[],who='perfil'):DietProfile{
 const f=defaultDiet(id);if(!raw||typeof raw!=='object')return f;
 const r=obj(raw),body=obj(r.body),routine=obj(r.routine);
 let goal=s(r.goal,160);if(OLD_GOALS[goal])goal=OLD_GOALS[goal];
 let notes=s(r.notes,400);
 if(OLD_DEFAULT_NOTES.has(norm(notes))||isSensitive(notes)){if(notes)removed?.push(`Observação de saúde pré-preenchida do ${who}`);notes=''}
 let avoids=list(r.avoids,30,60);
 if(!('intolerances' in r)&&avoids.length===2&&avoids.map(norm).sort().join('|')==='gluten|lactose'){avoids=[];removed?.push(`Restrições pré-preenchidas (lactose e glúten) do ${who}: cadastre de novo se forem reais`)}
 const isNew='onboarded' in r;
 return {
  goals:list(r.goals,6,20).filter(g=>GOALS.some(x=>x.key===g)) as DietProfile['goals'],goal:goal||(isNew||'intolerances' in r?'':f.goal),
  likes:list(r.likes,30,60),avoids,intolerances:list(r.intolerances,30,60),allergies:list(r.allergies,30,60),celiac:r.celiac===true,vegetarian:r.vegetarian===true,
  cookTime:oneOf(r.cookTime,['rapido','medio','sem_pressa'],'medio'),meals:oneOf(r.meals,['2','3','4','5+'],'3'),budget:oneOf(r.budget,['economico','moderado','livre'],'moderado'),
  style:oneOf(r.style,['simples','elaborado'],'simples'),breakfast:oneOf(r.breakfast,['doce','salgado','tanto_faz'],'tanto_faz'),notes,
  body:{weight:s(body.weight,10),height:s(body.height,10),age:s(body.age,3),activity:s(body.activity,80)},useBody:r.useBody===true,
  routine:{wake:time(routine.wake,'07:00'),sleep:time(routine.sleep,'23:00')},onboarded:r.onboarded===true,hidden:list(r.hidden,300,60),
 };
}

export function normalizeExercise(raw:unknown):ExerciseProfile{
 if(!raw||typeof raw!=='object')return DEFAULT_EXERCISE;
 const r=obj(raw),week:ExerciseProfile['week']={};
 for(const [k,v] of Object.entries(obj(r.week))){if(!DAYS.some(d=>d.key===k))continue;const e=obj(v);week[k]={kind:oneOf(e.kind,['treino','descanso','leve'],'descanso'),focus:oneOf(e.focus,FOCI.map(x=>x.key),'mobilidade'),minutes:Math.max(5,Math.min(60,Math.round(Number(e.minutes)||10)))}}
 return {
  clearance:oneOf(r.clearance,['nao_respondido','liberado','nao_sei','recuperacao'],'nao_respondido'),
  limits:list(r.limits,8,20).filter(x=>REGIONS.some(g=>g.key===x)) as ExerciseProfile['limits'],pain:r.pain===true,
  equipment:list(r.equipment,5,20).filter(x=>EQUIPMENT.some(g=>g.key===x)) as ExerciseProfile['equipment'],
  level:oneOf(r.level,['iniciante','intermediario'],'iniciante'),days:Math.max(1,Math.min(6,Math.round(Number(r.days)||3))),
  minutes:[10,15,20,30,45].includes(Number(r.minutes))?Number(r.minutes):20,
  guidance:(Array.isArray(r.guidance)?r.guidance:[]).map(x=>{const g=obj(x);return {id:s(g.id,40)||uid(),text:s(g.text,200),done:g.done===true}}).filter(g=>g.text).slice(0,30),
  notes:s(r.notes,400),week,answeredAt:s(r.answeredAt,30),
 };
}
export const normalizeSessions=(raw:unknown):Session[]=>Array.isArray(raw)?raw.map(x=>{const r=obj(x);return {id:s(r.id,40)||uid(),date:s(r.date,10),title:s(r.title,80),focus:oneOf(r.focus,FOCI.map(f=>f.key),'corpo'),minutes:Math.max(0,Math.min(180,Math.round(Number(r.minutes)||0))),exercises:list(r.exercises,60,40),feeling:(r.feeling==='facil'||r.feeling==='ok'||r.feeling==='dificil'?r.feeling:null) as Session['feeling']}}).filter(x=>sessionSchema.safeParse(x).success).slice(0,300):[];

// Aceita receita vinda da IA, de versões antigas ou do banco e devolve no formato atual.
export function normalizeSuggestion(raw:unknown,defaults:{forWho?:ForWho,mode?:'casa'|'delivery'}={}):Suggestion|null{
 if(!raw||typeof raw!=='object')return null;
 const r=raw as Record<string,unknown>;
 const title=s(r.title,120);if(!title)return null;
 const ing=Array.isArray(r.ingredients)?r.ingredients.slice(0,30).map(x=>typeof x==='string'?{name:s(x,80),qty:'',have:true}:x&&typeof x==='object'?{name:s((x as Record<string,unknown>).name,80),qty:s((x as Record<string,unknown>).qty,40),have:(x as Record<string,unknown>).have!==false}:null).filter((x):x is {name:string,qty:string,have:boolean}=>!!x&&!!x.name):[];
 const pp=(v:unknown)=>{const o=obj(v);return {pessoa1:s(o.pessoa1,240),pessoa2:s(o.pessoa2,240)}};
 const highlights=list(r.highlights,5,40);if(!highlights.length&&s(r.tag,40))highlights.push(s(r.tag,40));
 const m=obj(r.macros);
 const out:Suggestion={
  id:s(r.id,60)||uid(),title,description:s(r.description,400),minutes:Math.max(0,Math.min(600,Math.round(Number(r.minutes)||0))),
  difficulty:oneOf(r.difficulty,['facil','media','elaborada'],'facil'),image:DISH_KEYS.includes(r.image as DishKey)?r.image as DishKey:null,
  mode:oneOf(r.mode,['casa','delivery'],defaults.mode||'casa'),forWho:oneOf(r.forWho,['ambos','pessoa1','pessoa2'],defaults.forWho||'ambos'),
  ingredients:ing,steps:list(r.steps,20,500),substitutions:list(r.substitutions,10,240),portions:pp(r.portions),adaptations:pp(r.adaptations),
  highlights,nutrition:s(r.nutrition,240),cautions:list(r.cautions,6,300).filter(c=>!isSensitive(c)),askRestaurant:list(r.askRestaurant,6,200),
 };
 if(s(r.recipeId,60))out.recipeId=s(r.recipeId,60);
 if(r.source==='catalogo'||r.source==='ia'||r.source==='delivery')out.source=r.source;
 if(MEAL_CATS.includes(r.category as never))out.category=r.category as Suggestion['category'];
 if(Number(r.servings)>=1)out.servings=Math.min(30,Number(r.servings));
 if(m.status==='completo'||m.status==='indisponivel')out.macros={kcal:Number(m.kcal)||0,protein:Number(m.protein)||0,carbs:Number(m.carbs)||0,fat:Number(m.fat)||0,status:m.status};
 const thumbs=list(r.thumbs,3,40);if(thumbs.length)out.thumbs=thumbs;
 const flags=list(r.flags,12,20);if(flags.length)out.flags=flags;
 if(s(r.why,300))out.why=s(r.why,300);
 return suggestionSchema.safeParse(out).success?out:null;
}
export const normalizeSaved=(raw:unknown,max=200)=>Array.isArray(raw)?raw.map(x=>normalizeSuggestion(x)).filter((x):x is Suggestion=>!!x).slice(0,max):[];
export function normalizePlan(raw:unknown):Plan{
 const out:Plan={};
 for(const [k,v] of Object.entries(obj(raw))){
  if(!/^(seg|ter|qua|qui|sex|sab|dom)-(cafe|almoco|lanche|jantar)$/.test(k))continue;
  const e=obj(v);const recipe=normalizeSuggestion(e.recipe);if(!recipe)continue;
  const entry={recipe,forWho:oneOf(e.forWho,['ambos','pessoa1','pessoa2'],'ambos'),done:e.done===true};
  if(planEntrySchema.safeParse(entry).success)out[k]=entry;
 }
 return out;
}
export const normalizeShopping=(raw:unknown):ShoppingItem[]=>Array.isArray(raw)?raw.map(x=>{const r=obj(x);return {id:s(r.id,40)||uid(),name:s(r.name,80),done:r.done===true,source:s(r.source,120)}}).filter(x=>shoppingItemSchema.safeParse(x).success).slice(0,300):[];

export function normalizePerson(raw:Record<string,unknown>,id:PersonId,removed?:string[],who?:string):Partial<PersonState>{
 const out:Partial<PersonState>={};
 if(raw.diet!==undefined)out.diet=normalizeDiet(raw.diet,id,removed,who);
 if(raw.saved!==undefined)out.saved=normalizeSaved(raw.saved);
 if(raw.later!==undefined)out.later=normalizeSaved(raw.later,100);
 if(raw.plan!==undefined)out.plan=normalizePlan(raw.plan);
 if(raw.shopping!==undefined)out.shopping=normalizeShopping(raw.shopping);
 if(raw.exercise!==undefined)out.exercise=normalizeExercise(raw.exercise);
 if(raw.sessions!==undefined)out.sessions=normalizeSessions(raw.sessions);
 return out;
}

// Migração da versão 2 (dados compartilhados: profiles/saved/plan/shopping) para dados por pessoa.
// Cada perfil antigo vira o perfil alimentar daquela pessoa; o plano é dividido por "para quem";
// favoritas e lista de compras, sem dono definido, vão para as duas pessoas (cada uma pode apagar depois).
export function migrateV2(raw:Record<string,unknown>,removed:string[]=[]):{public:PublicProfiles,persons:Record<PersonId,Partial<PersonState>>}{
 const profiles=obj(raw.profiles);
 const pub=normalizePublic(profiles);
 const persons={pessoa1:{},pessoa2:{}} as Record<PersonId,Partial<PersonState>>;
 for(const id of PEOPLE){
  if(profiles[id])persons[id].diet=normalizeDiet(profiles[id],id,removed,`perfil de ${pub[id].name}`);
  if(raw.saved!==undefined)persons[id].saved=normalizeSaved(raw.saved);
  if(raw.shopping!==undefined)persons[id].shopping=normalizeShopping(raw.shopping);
 }
 if(raw.plan!==undefined){
  const plan=normalizePlan(raw.plan);
  for(const id of PEOPLE)persons[id].plan=Object.fromEntries(Object.entries(plan).filter(([,e])=>e.forWho==='ambos'||e.forWho===id));
 }
 return {public:pub,persons};
}
