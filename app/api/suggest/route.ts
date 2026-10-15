import {NextResponse} from 'next/server';
import {callOpenAI,clean} from '@/lib/ai';
import {DISH_KEYS,type DishKey} from '@/lib/catalog';
import {fallbackDelivery} from '@/lib/delivery';
import {normalizeSuggestion} from '@/lib/normalize';
import {computeNutrition,formatQty,ingredientName,parseSpec,type IngredientSpec} from '@/lib/nutrition/calc';
import {getFood} from '@/lib/nutrition/foods';
import {buildDeliveryInput,buildPickInput,DELIVERY_SYSTEM,peopleOf,PICK_SYSTEM} from '@/lib/prompts';
import {guardAI} from '@/lib/rateLimit';
import {candidatesForAI,daySeed,searchRecipes} from '@/lib/recipes';
import {restrictionFlags} from '@/lib/restrictions';
import {suggestRequestSchema,type RecipeSearch,type SuggestRequest,type SuggestResponse,type Suggestion} from '@/lib/types';
export const runtime='nodejs';

const NOTICE='Sugestões educativas, não substituem nutricionista ou médico. Valores nutricionais estimados por tabelas (TACO/USDA), não medidos em laboratório. Em caso de alergia, confira rótulos e contaminação cruzada.';
const INTENT_GOAL={leve:'leve',satisfeito:'equilibrada',fome:'energetica',treino:'proteica'} as const;
const s=(v:unknown,max:number)=>typeof v==='string'?clean(v,max):'';

// Candidatas do catálogo, afrouxando filtros se a combinação ficar restrita demais.
function candidates(req:SuggestRequest,size:number){
 const people=peopleOf(req).map(([,p])=>p);
 const base:RecipeSearch={
  meal:req.meal,have:req.ingredients.map(i=>i.name),exclude:req.exclude,pageSize:size,page:0,
  seed:req.kind==='surpresa'||req.kind==='trocar'?Math.floor(Math.random()*1e6):daySeed()+req.exclude.length,
  personal:{flags:[...new Set(people.flatMap(restrictionFlags))],avoid:[...new Set(people.flatMap(p=>p.avoids))],likes:[...new Set(people.flatMap(p=>p.likes))],hidden:[]},
 };
 const tries:RecipeSearch[]=[];
 const goal=req.intent&&req.intent in INTENT_GOAL?INTENT_GOAL[req.intent as keyof typeof INTENT_GOAL]:undefined;
 const maxTime=req.intent==='rapido'?15:req.time==='rapido'?20:undefined;
 const avail=req.kind==='cozinhar'||req.intent==='casa'?'geladeira' as const:undefined;
 tries.push({...base,goal,maxTime,avail},{...base,maxTime,avail},{...base,avail},{...base});
 for(const t of tries){const r=searchRecipes(t,req.forWho);if(r.items.length>=Math.min(size,req.count))return r}
 return searchRecipes(base,req.forWho);
}

function novaFromAI(raw:unknown,req:SuggestRequest):Suggestion|null{
 if(!raw||typeof raw!=='object')return null;
 const r=raw as Record<string,unknown>;
 try{
  const ings:IngredientSpec[]=(Array.isArray(r.ingredients)?r.ingredients:[]).slice(0,15).map(x=>{const i=x as Record<string,unknown>;return parseSpec(`${String(i.food)} ${i.unit==='agosto'?'':Number(i.amount)}${String(i.unit)}`)});
  if(ings.length<2)return null;
  const servings=Math.max(1,Math.min(8,Math.round(Number(r.servings)||2)));
  const n=computeNutrition(ings,servings);
  const sug=normalizeSuggestion({title:s(r.title,120),description:s(r.description,400),minutes:Number(r.minutes)||20,difficulty:'facil',image:DISH_KEYS.includes(r.image as DishKey)?r.image:null,mode:'casa',forWho:req.forWho,
   ingredients:ings.map(i=>({name:ingredientName(i),qty:formatQty(i.amount,i.unit),have:true})),steps:(Array.isArray(r.steps)?r.steps:[]).map(x=>s(x,500)).filter(Boolean).slice(0,12),
   highlights:['Criada pela IA'],source:'ia',servings,thumbs:ings.map(i=>getFood(i.food)?.img).filter(Boolean).slice(0,3),
   macros:n.perServing?{kcal:n.perServing.kcal,protein:n.perServing.protein,carbs:n.perServing.carbs,fat:n.perServing.fat,status:'completo'}:{kcal:0,protein:0,carbs:0,fat:0,status:'indisponivel'},
   why:'Receita nova montada com o que você tem; valores calculados pelo app a partir das tabelas.'},{forWho:req.forWho});
  return sug&&sug.steps.length?sug:null;
 }catch{return null} // estrutura inválida: descarta em vez de mostrar dados não validados
}

export async function POST(req:Request){
 const parsed=suggestRequestSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Não entendi o pedido. Confira as escolhas e tente de novo.'},{status:400});
 const data=parsed.data;
 // Isolamento: com uma pessoa só, o perfil da outra é descartado mesmo que tenha sido enviado.
 if(data.forWho!=='ambos')data.profiles={[data.forWho]:data.profiles[data.forWho]};

 if(data.kind==='delivery'){
  const limited=await guardAI(req);if(limited)return limited;
  try{
   const raw=await callOpenAI({messages:[{role:'system',content:DELIVERY_SYSTEM},{role:'user',content:buildDeliveryInput(data)}]},process.env.OPENAI_TEXT_MODEL||'gpt-4.1-mini',700*data.count+300);
   const list=(Array.isArray(raw.suggestions)?raw.suggestions:[]).map(x=>normalizeSuggestion({...(x as object),mode:'delivery',forWho:data.forWho,id:undefined,source:'delivery'},{forWho:data.forWho,mode:'delivery'})).filter((x):x is Suggestion=>!!x).slice(0,data.count);
   if(!list.length)throw new Error('Resposta vazia da IA.');
   return NextResponse.json({intro:s(raw.intro,240),suggestions:list,tip:s(raw.tip,240),notice:'Ideias de pedido, não restaurantes reais. Preços e disponibilidade dependem do app de delivery.',fallback:false} satisfies SuggestResponse);
  }catch(e){
   return NextResponse.json({intro:'A IA não respondeu agora, então separei ideias gerais de pedido.',suggestions:fallbackDelivery(data),tip:'',notice:`Ideias de pedido, não restaurantes reais. (Motivo: ${e instanceof Error?e.message:'erro'})`,fallback:true} satisfies SuggestResponse);
  }
 }

 const pool=candidates(data,Math.max(data.count*3,12));
 if(!pool.items.length)return NextResponse.json({error:'Não encontrei receitas com essas restrições. Tente afrouxar algum filtro.'},{status:404});
 const fallback=():SuggestResponse=>({intro:'Separei receitas do catálogo que combinam com o momento.',suggestions:pool.items.slice(0,data.count),tip:'',notice:NOTICE,fallback:true});
 const limited=await guardAI(req);if(limited){const fb=fallback();fb.intro='O limite de uso da IA foi atingido; mostrando receitas do catálogo filtradas para você.';return NextResponse.json(fb)}
 try{
  const raw=await callOpenAI({messages:[{role:'system',content:PICK_SYSTEM},{role:'user',content:buildPickInput(data,candidatesForAI(pool.items))}]},process.env.OPENAI_TEXT_MODEL||'gpt-4.1-mini',260*data.count+(data.kind==='cozinhar'?700:300));
  const byId=new Map(pool.items.map(i=>[i.recipeId,i]));
  const picks=(Array.isArray(raw.picks)?raw.picks:[]).map(x=>x as Record<string,unknown>).filter(p=>byId.has(String(p.id)));
  const chosen:Suggestion[]=[];
  for(const p of picks){
   const base=byId.get(String(p.id))!;if(chosen.some(c=>c.id===base.id))continue;
   const pp=(v:unknown)=>{const o=(v&&typeof v==='object'?v:{}) as Record<string,unknown>;return {pessoa1:s(o.pessoa1,240),pessoa2:s(o.pessoa2,240)}};
   chosen.push({...base,why:s(p.why,300)||undefined,portions:pp(p.portions),adaptations:pp(p.adaptations),cautions:(Array.isArray(p.cautions)?p.cautions:[]).map(c=>s(c,300)).filter(Boolean).slice(0,4)});
  }
  // Completa com as melhores do catálogo se a IA escolheu menos que o pedido.
  for(const it of pool.items){if(chosen.length>=data.count)break;if(!chosen.some(c=>c.id===it.id))chosen.push(it)}
  const nova=data.kind==='cozinhar'?novaFromAI(raw.nova,data):null;
  if(nova)chosen.splice(Math.min(1,chosen.length),0,nova);
  return NextResponse.json({intro:s(raw.intro,240),suggestions:chosen.slice(0,data.count+(nova?1:0)),tip:s(raw.tip,240),notice:NOTICE,fallback:false} satisfies SuggestResponse);
 }catch{
  return NextResponse.json(fallback());
 }
}
