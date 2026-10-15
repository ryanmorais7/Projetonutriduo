// Catálogo de receitas no servidor: busca, filtros, resumo para cards, detalhe e montagem do cardápio.
// Fica fora do pacote do navegador: o celular só recebe a página de resultados que pediu.
import {norm} from '../catalog';
import {computeNutrition,formatQty,ingredientName,type NutritionResult} from '../nutrition/calc';
import {getFood,PANTRY_GROUPS,type FoodFlag} from '../nutrition/foods';
import type {ForWho,MealKey,RecipeDetailDTO,RecipeSearch,RecipeSearchResult,Suggestion} from '../types';
import {recipeSearchSchema} from '../types';
import {ALMOCO} from './data-almoco';
import {CAFE} from './data-cafe';
import {EXTRA} from './data-extra';
import {JANTAR} from './data-jantar';
import {LANCHE} from './data-lanche';
import type {RecipeData} from './dsl';

export const RECIPES:RecipeData[]=[...CAFE,...ALMOCO,...LANCHE,...JANTAR,...EXTRA];
const BY_ID=new Map(RECIPES.map(r=>[r.id,r]));
export const getRecipe=(id:string)=>BY_ID.get(id);

const NUTRITION=new Map<string,NutritionResult>(RECIPES.map(r=>[r.id,computeNutrition(r.ingredients,r.servings)]));
export const recipeNutrition=(id:string)=>NUTRITION.get(id);
const FLAGS=new Map<string,Set<FoodFlag>>(RECIPES.map(r=>[r.id,new Set(r.ingredients.flatMap(i=>i.unit==='agosto'?[]:getFood(i.food)?.flags||[]))]));
export const recipeFlags=(id:string)=>[...(FLAGS.get(id)||[])];

const isStaple=(foodId:string)=>!!getFood(foodId)?.staple;
// Ingredientes que contam para "tenho / falta": sem sal, água, óleo e temperos a gosto.
const countable=(r:RecipeData)=>r.ingredients.filter(i=>i.unit!=='agosto'&&!isStaple(i.food));
const groupsOf=(r:RecipeData)=>new Set(countable(r).map(i=>getFood(i.food)!.group));

// Liga o que a pessoa disse ter ("frango congelado", "Macaxeira") aos grupos do banco.
export function pantryGroups(have:string[]):Set<string>{
 const out=new Set<string>();
 for(const h of have.map(norm))for(const [group,words] of Object.entries(PANTRY_GROUPS))if(words.some(w=>h.includes(w)||(w.length>3&&w.includes(h))))out.add(group);
 return out;
}
const missingCount=(r:RecipeData,pantry:Set<string>)=>[...groupsOf(r)].filter(g=>!pantry.has(g)).length;

// Ingredientes principais para a montagem visual do card (por peso). Se o ingrediente principal não tem
// foto (ex.: melancia), não mostra a dos secundários: um limão no card da melancia seria enganoso.
function thumbsOf(r:RecipeData){
 const byWeight=countable(r).map(i=>{const f=getFood(i.food)!;return {img:f.img,w:i.unit==='g'||i.unit==='ml'?i.amount*(f.density??1):i.amount*(f.units[i.unit as keyof typeof f.units]||30)}}).sort((a,b)=>b.w-a.w);
 if(!byWeight[0]?.img)return [];
 return byWeight.filter(x=>x.img).map(x=>x.img!).filter((v,i,a)=>a.indexOf(v)===i).slice(0,3);
}

const HIGHLIGHT_TAGS:Record<string,string>={nordeste:'Nordestina',economica:'Econômica',sem_fogao:'Sem fogão',pre_treino:'Pré-treino',pos_treino:'Pós-treino',sobremesa:'Sobremesa',marmita:'Vai na marmita'};
const lightCat=(r:RecipeData)=>r.cat==='cafe'||r.cat==='lanche'||r.cat==='extra';

// Limiares por porção usados nos filtros de objetivo (documentados para não parecerem "mágicos").
export const GOAL_RULES={
 proteica:(r:RecipeData,n:NutritionResult)=>!!n.perServing&&n.perServing.protein>=(lightCat(r)?15:25),
 energetica:(r:RecipeData,n:NutritionResult)=>!!n.perServing&&n.perServing.kcal>=(lightCat(r)?350:550),
 leve:(r:RecipeData,n:NutritionResult)=>!!n.perServing&&n.perServing.kcal<=(lightCat(r)?250:400),
 equilibrada:(_r:RecipeData,n:NutritionResult)=>!!n.perServing&&n.perServing.protein>=10&&(n.perServing.fiber??0)>=3,
 economica:(r:RecipeData)=>r.tags.includes('economica'),
};

export function toSuggestion(r:RecipeData,o:{pantry?:Set<string>,forWho?:ForWho}={}):Suggestion{
 const n=NUTRITION.get(r.id)!;
 const pantry=o.pantry;
 const highlights=[...r.tags.map(t=>HIGHLIGHT_TAGS[t]).filter(Boolean)];
 if(n.perServing&&n.perServing.protein>=(lightCat(r)?15:25))highlights.unshift('Rica em proteína');
 return {
  id:r.id,recipeId:r.id,source:'catalogo',title:r.title,description:r.description,minutes:r.minutes,difficulty:r.difficulty,
  image:r.photo,mode:'casa',forWho:o.forWho||'ambos',category:r.cat,servings:r.servings,
  ingredients:r.ingredients.map(i=>({name:ingredientName(i),qty:formatQty(i.amount,i.unit),have:i.unit==='agosto'||isStaple(i.food)||(pantry?pantry.has(getFood(i.food)!.group):false)})),
  steps:r.steps,substitutions:r.subs,portions:{pessoa1:'',pessoa2:''},adaptations:{pessoa1:'',pessoa2:''},
  highlights:[...new Set(highlights)].slice(0,3),nutrition:'',cautions:[],askRestaurant:[],
  macros:n.perServing?{kcal:n.perServing.kcal,protein:n.perServing.protein,carbs:n.perServing.carbs,fat:n.perServing.fat,status:'completo'}:{kcal:0,protein:0,carbs:0,fat:0,status:'indisponivel'},
  thumbs:thumbsOf(r),flags:recipeFlags(r.id),
 };
}

export function toDetail(r:RecipeData):RecipeDetailDTO{
 return {id:r.id,title:r.title,description:r.description,cat:r.cat,also:r.also,minutes:r.minutes,difficulty:r.difficulty,servings:r.servings,photo:r.photo,thumbs:thumbsOf(r),steps:r.steps,subs:r.subs,tags:r.tags,flags:recipeFlags(r.id),ingredients:r.ingredients.map(i=>({food:i.food,amount:i.amount,unit:i.unit,cooked:i.cooked,label:i.label}))};
}

// Embaralhamento determinístico: mesma semente → mesma ordem (a semente padrão muda a cada dia).
// FNV-1a + finalização do MurmurHash3: sementes vizinhas geram ordens bem diferentes.
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return (h>>>0)/4294967295};
export const daySeed=(d=new Date())=>Math.floor(d.getTime()/864e5);

function matchesMeal(r:RecipeData,meal?:string){
 if(!meal)return true;
 if(meal==='sobremesa')return r.tags.includes('sobremesa');
 return r.cat===meal||r.also.includes(meal as RecipeData['cat']);
}

export function filterRecipes(input:RecipeSearch){
 const p=recipeSearchSchema.parse(input);
 const pantry=pantryGroups(p.have);
 const excluded=new Set([...p.exclude,...(p.personal?.hidden||[])]);
 const blocked=new Set(p.personal?.flags||[]);
 const avoid=(p.personal?.avoid||[]).map(norm).filter(Boolean);
 const likes=(p.personal?.likes||[]).map(norm).filter(Boolean);
 const q=p.q?norm(p.q):'';
 const without=p.without?norm(p.without):'';
 const similar=p.similarTo?getRecipe(p.similarTo):undefined;
 const simGroups=similar?groupsOf(similar):null;
 const seed=p.seed??daySeed();
 const list=RECIPES.filter(r=>{
  if(excluded.has(r.id)||r.id===p.similarTo)return false;
  if(!matchesMeal(r,p.meal))return false;
  if(similar&&!(r.cat===similar.cat||r.also.includes(similar.cat)))return false;
  if(p.maxTime&&r.minutes>p.maxTime)return false;
  const flags=FLAGS.get(r.id)!;
  if(p.noLactose&&flags.has('lactose'))return false;
  if(p.noGluten&&flags.has('gluten'))return false;
  if(p.vegetarian&&(flags.has('carne')||flags.has('peixe')||flags.has('frutos_do_mar')))return false;
  if([...blocked].some(f=>flags.has(f as FoodFlag)))return false;
  const names=r.ingredients.map(i=>norm(`${ingredientName(i)} ${getFood(i.food)!.group}`));
  if(without&&names.some(n=>n.includes(without)))return false;
  if(avoid.some(a=>names.some(n=>n.includes(a))))return false;
  if(q&&!norm(r.title).includes(q)&&!names.some(n=>n.includes(q)))return false;
  if(p.tags?.length&&!p.tags.every(t=>r.tags.includes(t)))return false;
  if(p.goal){const n=NUTRITION.get(r.id)!;if(!GOAL_RULES[p.goal](r,n))return false}
  if(p.avail==='todos'&&missingCount(r,pantry)>0)return false;
  if(p.avail==='falta1'&&missingCount(r,pantry)>1)return false;
  if(p.avail==='geladeira'&&![...groupsOf(r)].some(g=>pantry.has(g)))return false;
  return true;
 });
 const score=(r:RecipeData)=>{
  let s=hash(`${r.id}:${seed}`)*2;
  if(pantry.size){const g=[...groupsOf(r)];s+=g.filter(x=>pantry.has(x)).length*3-g.filter(x=>!pantry.has(x)).length*(p.avail==='geladeira'?1:0.3)}
  if(likes.length){const names=r.ingredients.map(i=>norm(ingredientName(i)));s+=likes.filter(l=>names.some(n=>n.includes(l))).length*2}
  if(simGroups){s+=[...groupsOf(r)].filter(g=>simGroups.has(g)).length*3}
  return s;
 };
 return {params:p,pantry,ranked:list.map(r=>({r,s:score(r)})).sort((a,b)=>b.s-a.s).map(x=>x.r)};
}

export function searchRecipes(input:RecipeSearch,forWho?:ForWho):RecipeSearchResult{
 const {params,pantry,ranked}=filterRecipes(input);
 const start=params.page*params.pageSize;
 return {items:ranked.slice(start,start+params.pageSize).map(r=>toSuggestion(r,{pantry,forWho})),total:ranked.length,hasMore:start+params.pageSize<ranked.length};
}

// Monta (ou remonta) refeições do cardápio semanal, preservando o restante.
// Evita repetir receitas na semana e favorece ingredientes já usados em outros dias (menos desperdício).
export function planMeals(o:{slots:{key:string,meal:MealKey}[],keep:string[],search:RecipeSearch,forWho:ForWho,seed?:number}):Record<string,Suggestion>{
 const used=new Set(o.keep);
 const weekGroups=new Map<string,number>();
 for(const id of o.keep){const r=getRecipe(id);if(r)groupsOf(r).forEach(g=>weekGroups.set(g,(weekGroups.get(g)||0)+1))}
 const out:Record<string,Suggestion>={};
 for(const slot of o.slots){
  const {ranked,pantry}=filterRecipes({...o.search,meal:slot.meal,exclude:[...(o.search.exclude||[]),...used],seed:(o.seed??daySeed())+slot.key.length+used.size,page:0,pageSize:6});
  const best=ranked.slice(0,12).map(r=>({r,s:[...groupsOf(r)].reduce((a,g)=>a+(weekGroups.has(g)?1:0),0)+(ranked.indexOf(r)<4?1:0)})).sort((a,b)=>b.s-a.s)[0]?.r;
  if(!best)continue;
  used.add(best.id);groupsOf(best).forEach(g=>weekGroups.set(g,(weekGroups.get(g)||0)+1));
  out[slot.key]=toSuggestion(best,{pantry,forWho:o.forWho});
 }
 return out;
}

// Lista compacta para a IA escolher (ela seleciona ids; não inventa números).
export function candidatesForAI(items:Suggestion[]){
 return items.map(s=>({id:s.recipeId,titulo:s.title,tipo:s.category,minutos:s.minutes,porcoes:s.servings,kcalPorPorcao:s.macros?.status==='completo'?s.macros.kcal:null,proteinaPorPorcao:s.macros?.status==='completo'?s.macros.protein:null,ingredientes:s.ingredients.filter(i=>i.qty!=='a gosto').map(i=>i.name).slice(0,8),contem:s.flags}));
}
