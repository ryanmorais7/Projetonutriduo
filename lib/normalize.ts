import {AVATARS,COLORS,DISH_KEYS,norm,type DishKey} from './catalog';
import {planEntrySchema,shoppingItemSchema,suggestionSchema,type ForWho,type Plan,type Profile,type Profiles,type ShoppingItem,type Suggestion} from './types';

export const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const s=(v:unknown,max:number,f='')=>typeof v==='string'?v.trim().slice(0,max):typeof v==='number'?String(v).slice(0,max):f;
const list=(v:unknown,max:number,itemMax:number)=>Array.isArray(v)?v.map(x=>s(x,itemMax)).filter(Boolean).slice(0,max):[];
const oneOf=<T extends string>(v:unknown,opts:readonly T[],f:T):T=>opts.includes(v as T)?v as T:f;

const blankProfile=(p:Partial<Profile>):Profile=>({name:'',avatar:'🍳',color:'floresta',goal:'',likes:[],avoids:[],intolerances:[],allergies:[],celiac:false,cookTime:'medio',meals:'3',budget:'moderado',style:'simples',notes:'',body:{weight:'',height:'',activity:''},useBody:false,...p});
export const DEFAULT_PROFILES:Profiles={
 pessoa1:blankProfile({name:'Ryan',avatar:'💪',color:'floresta',goal:'Recuperar massa muscular com alimentação equilibrada e evolução física'}),
 pessoa2:blankProfile({name:'Chrysalis',avatar:'🌸',color:'coral',goal:''}),
};

// Valores pré-preenchidos da versão antiga que expunham saúde/rotina pessoal. Só eles são removidos;
// qualquer coisa que a pessoa tenha digitado diferente disso é preservada para revisão manual.
const OLD_DEFAULT_NOTES=new Set(['intestino sensivel. evitar alimentos que provoquem sintomas.','recuperar massa muscular com retorno gradual aos treinos, conforme liberacao medica.']);
const OLD_DEFAULT_NAMES:Record<string,string>={eu:'Ryan','meu amor':'Chrysalis'};
const OLD_GOALS:Record<string,string>={musculo:'Apoiar recuperação muscular',equilibrio:'Comer de forma equilibrada',energia:'Ter mais energia no dia'};
const SENSITIVE=/caneta|emagrec|medica[cç][aã]o|rem[eé]dio|diarreia|dor abdominal|sintomas? (dela|persistentes|ativos)|desidrata|sangue nas fezes|desmaio/i;
export const isSensitive=(text:string)=>SENSITIVE.test(text);

export function normalizeProfile(raw:unknown,fallback:Profile,removed?:string[]):Profile{
 if(!raw||typeof raw!=='object')return fallback;
 const r=raw as Record<string,unknown>;
 let name=s(r.name,40,fallback.name);
 if(OLD_DEFAULT_NAMES[norm(name)])name=OLD_DEFAULT_NAMES[norm(name)];
 let goal=s(r.goal,160);if(OLD_GOALS[goal])goal=OLD_GOALS[goal];
 let notes=s(r.notes,400);
 if(OLD_DEFAULT_NOTES.has(norm(notes))||isSensitive(notes)){if(notes)removed?.push(`Observação de saúde pré-preenchida do perfil "${name}"`);notes=''}
 let avoids=list(r.avoids,30,60);
 // Restrições que vieram pré-preenchidas na versão antiga (exatamente Lactose + Glúten, sem os campos novos).
 if(!('intolerances' in r)&&avoids.length===2&&avoids.map(norm).sort().join('|')==='gluten|lactose'){avoids=[];removed?.push(`Restrições pré-preenchidas (lactose e glúten) do perfil "${name}" — cadastre de novo se forem reais`)}
 const body=(r.body&&typeof r.body==='object'?r.body:{}) as Record<string,unknown>;
 return {
  name,avatar:AVATARS.includes(s(r.avatar,16))?s(r.avatar,16):fallback.avatar,color:oneOf(r.color,Object.keys(COLORS) as (keyof typeof COLORS)[],fallback.color),
  goal:goal||(('intolerances' in r)?'':fallback.goal),likes:list(r.likes,30,60),avoids,intolerances:list(r.intolerances,30,60),allergies:list(r.allergies,30,60),
  celiac:r.celiac===true,cookTime:oneOf(r.cookTime,['rapido','medio','sem_pressa'],'medio'),meals:oneOf(r.meals,['2','3','4','5+'],'3'),
  budget:oneOf(r.budget,['economico','moderado','livre'],'moderado'),style:oneOf(r.style,['simples','elaborado'],'simples'),notes,
  body:{weight:s(body.weight,10),height:s(body.height,10),activity:s(body.activity,80)},useBody:r.useBody===true,
 };
}
export function normalizeProfiles(raw:unknown,removed?:string[]):Profiles{
 const r=(raw&&typeof raw==='object'?raw:{}) as Record<string,unknown>;
 return {pessoa1:normalizeProfile(r.pessoa1,DEFAULT_PROFILES.pessoa1,removed),pessoa2:normalizeProfile(r.pessoa2,DEFAULT_PROFILES.pessoa2,removed)};
}

// Aceita receita vinda da IA, da versão antiga (ingredients: string[]) ou do banco, e devolve no formato atual.
export function normalizeSuggestion(raw:unknown,defaults:{forWho?:ForWho,mode?:'casa'|'delivery'}={}):Suggestion|null{
 if(!raw||typeof raw!=='object')return null;
 const r=raw as Record<string,unknown>;
 const title=s(r.title,120);if(!title)return null;
 const ing=Array.isArray(r.ingredients)?r.ingredients.slice(0,30).map(x=>typeof x==='string'?{name:s(x,80),qty:'',have:true}:x&&typeof x==='object'?{name:s((x as Record<string,unknown>).name,80),qty:s((x as Record<string,unknown>).qty,40),have:(x as Record<string,unknown>).have!==false}:null).filter((x):x is {name:string,qty:string,have:boolean}=>!!x&&!!x.name):[];
 const pp=(v:unknown)=>{const o=(v&&typeof v==='object'?v:{}) as Record<string,unknown>;return {pessoa1:s(o.pessoa1,240),pessoa2:s(o.pessoa2,240)}};
 const highlights=list(r.highlights,5,40);if(!highlights.length&&s(r.tag,40))highlights.push(s(r.tag,40));
 const out:Suggestion={
  id:s(r.id,40)||uid(),title,description:s(r.description,400),minutes:Math.max(0,Math.min(600,Math.round(Number(r.minutes)||0))),
  difficulty:oneOf(r.difficulty,['facil','media','elaborada'],'facil'),image:oneOf(r.image,DISH_KEYS as readonly DishKey[],'caseira'),
  mode:oneOf(r.mode,['casa','delivery'],defaults.mode||'casa'),forWho:oneOf(r.forWho,['ambos','pessoa1','pessoa2'],defaults.forWho||'ambos'),
  ingredients:ing,steps:list(r.steps,20,500),substitutions:list(r.substitutions,10,240),
  portions:pp(r.portions),adaptations:pp(r.adaptations),highlights,nutrition:s(r.nutrition,240),
  // Alertas antigos ligados aos sintomas pessoais saem; alertas gerais de alergia/segurança ficam.
  cautions:list(r.cautions,6,300).filter(c=>!isSensitive(c)),askRestaurant:list(r.askRestaurant,6,200),
 };
 return suggestionSchema.safeParse(out).success?out:null;
}
export const normalizeSaved=(raw:unknown)=>Array.isArray(raw)?raw.map(x=>normalizeSuggestion(x)).filter((x):x is Suggestion=>!!x).slice(0,200):[];
export function normalizePlan(raw:unknown):Plan{
 const out:Plan={};if(!raw||typeof raw!=='object')return out;
 for(const [k,v] of Object.entries(raw as Record<string,unknown>)){
  if(!/^(seg|ter|qua|qui|sex|sab|dom)-(cafe|almoco|lanche|jantar)$/.test(k)||!v||typeof v!=='object')continue;
  const e=v as Record<string,unknown>;const recipe=normalizeSuggestion(e.recipe);if(!recipe)continue;
  const entry={recipe,forWho:oneOf(e.forWho,['ambos','pessoa1','pessoa2'],'ambos'),done:e.done===true};
  if(planEntrySchema.safeParse(entry).success)out[k]=entry;
 }
 return out;
}
export const normalizeShopping=(raw:unknown):ShoppingItem[]=>Array.isArray(raw)?raw.map(x=>{const r=(x&&typeof x==='object'?x:{}) as Record<string,unknown>;return {id:s(r.id,40)||uid(),name:s(r.name,80),done:r.done===true,source:s(r.source,120)}}).filter(x=>shoppingItemSchema.safeParse(x).success).slice(0,300):[];
