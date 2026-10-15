import {getFood,type Food,type Per100,type Unit} from './foods';

// Serviço determinístico de cálculo nutricional:
// 1) normaliza o ingrediente (id do banco + quantidade + unidade); 2) converte a medida caseira em gramas;
// 3) calcula os nutrientes pela quantidade; 4) soma; 5) divide pelo rendimento (porções).
// Nada aqui depende de IA: os mesmos dados sempre dão o mesmo resultado.

// Conversão de medidas caseiras. Para líquidos (alimentos com densidade): colher de sopa = 15 ml,
// colher de chá = 5 ml, xícara = 240 ml, convertidos em gramas pela densidade.
// Para sólidos, cada alimento declara o peso da sua medida em foods.ts (valores usuais aproximados de
// medidas caseiras brasileiras; ver Pinheiro et al., Tabela para Avaliação de Consumo Alimentar em
// Medidas Caseiras, para conferência).
const LIQUID_ML:Partial<Record<Unit,number>>={cs:15,cc:5,xic:240};

export const UNIT_LABEL:Record<Unit,[string,string]>={g:['g','g'],ml:['ml','ml'],un:['unidade','unidades'],cs:['colher de sopa','colheres de sopa'],cc:['colher de chá','colheres de chá'],xic:['xícara','xícaras'],fatia:['fatia','fatias'],concha:['concha','conchas'],dente:['dente','dentes'],file:['filé','filés'],agosto:['a gosto','a gosto']};

export function toGrams(food:Food,amount:number,unit:Unit):number|null{
 if(unit==='agosto'||!(amount>0))return null;
 if(unit==='g')return amount;
 if(unit==='ml')return amount*(food.density??1);
 const solid=food.units[unit];
 if(solid)return amount*solid;
 const ml=LIQUID_ML[unit];
 if(ml&&food.density)return amount*ml*food.density;
 return null; // medida sem fator documentado para este alimento: não inventa
}

export type IngredientSpec={food:string,amount:number,unit:Unit,cooked:boolean,label?:string};
export type Nutrients={kcal:number,protein:number,carbs:number,fat:number,sat:number|null,fiber:number|null,sodium:number|null};
export type NutritionResult={
 status:'completo'|'indisponivel',
 perServing:Nutrients|null,total:Nutrients|null,
 portionGrams:number|null,servings:number,
 missing:string[],sources:string[],partialSat:boolean,
};

const ZERO=():Nutrients=>({kcal:0,protein:0,carbs:0,fat:0,sat:0,fiber:0,sodium:0});
const add=(acc:Nutrients,p:Per100,grams:number)=>{
 const k=grams/100;
 acc.kcal+=p.kcal*k;acc.protein+=p.protein*k;acc.carbs+=p.carbs*k;acc.fat+=p.fat*k;
 // Um único nutriente sem dado torna o total daquele nutriente "não disponível" (null), nunca zero.
 acc.sat=acc.sat===null||p.sat===null?null:acc.sat+p.sat*k;
 acc.fiber=acc.fiber===null||p.fiber===null?null:acc.fiber+p.fiber*k;
 acc.sodium=acc.sodium===null||p.sodium===null?null:acc.sodium+p.sodium*k;
};
export const scaleNutrients=(x:Nutrients,factor:number):Nutrients=>({kcal:x.kcal*factor,protein:x.protein*factor,carbs:x.carbs*factor,fat:x.fat*factor,sat:x.sat===null?null:x.sat*factor,fiber:x.fiber===null?null:x.fiber*factor,sodium:x.sodium===null?null:x.sodium*factor});
export const roundNutrients=(x:Nutrients):Nutrients=>({kcal:Math.round(x.kcal),protein:Math.round(x.protein*10)/10,carbs:Math.round(x.carbs*10)/10,fat:Math.round(x.fat*10)/10,sat:x.sat===null?null:Math.round(x.sat*10)/10,fiber:x.fiber===null?null:Math.round(x.fiber*10)/10,sodium:x.sodium===null?null:Math.round(x.sodium)});

export function computeNutrition(ingredients:IngredientSpec[],servings:number):NutritionResult{
 const total=ZERO(),missing:string[]=[],sources=new Set<string>();
 let grams=0,partialSat=false;
 for(const ing of ingredients){
  if(ing.unit==='agosto')continue; // temperos a gosto ficam fora (quantidade indefinida)
  const food=getFood(ing.food);
  const g=food?toGrams(food,ing.amount,ing.unit):null;
  if(!food||g===null){missing.push(ing.label||food?.name||ing.food);continue}
  if(food.per100.sat===null&&food.per100.fat>0.5)partialSat=true;
  add(total,food.per100,g);
  grams+=g*(ing.cooked&&food.cf?food.cf:1);
  if(food.source!=='derivado'||food.per100.kcal>0)sources.add(food.source==='derivado'?`Derivado: ${food.ref}`:`${food.source}: ${food.ref}`);
 }
 const s=Math.max(1,servings);
 if(missing.length)return {status:'indisponivel',perServing:null,total:null,portionGrams:null,servings:s,missing,sources:[...sources],partialSat};
 return {status:'completo',perServing:roundNutrients(scaleNutrients(total,1/s)),total:roundNutrients(total),portionGrams:Math.round(grams/s),servings:s,missing,sources:[...sources],partialSat};
}

// Lê a notação compacta usada no catálogo: "frango 300g~", "ovo 2un", "azeite 1cs", "sal agosto", "x 1un:rótulo".
const SPEC=/^([a-z0-9_]+)\s+(?:(\d+(?:[.,]\d+)?)\s*)?(g|ml|un|cs|cc|xic|fatia|concha|dente|file|agosto)(~)?(?:\s*:\s*(.+))?$/;
export function parseSpec(text:string):IngredientSpec{
 const m=text.trim().match(SPEC);
 if(!m)throw new Error(`Ingrediente mal formatado: "${text}"`);
 const [,food,amount,unit,cooked,label]=m;
 if(!getFood(food))throw new Error(`Alimento desconhecido no banco: "${food}"`);
 if(unit!=='agosto'&&!amount)throw new Error(`Quantidade ausente: "${text}"`);
 return {food,amount:amount?Number(amount.replace(',','.')):0,unit:unit as Unit,cooked:!!cooked,label:label?.trim()};
}

const fmtNum=(x:number)=>{const r=Math.round(x*100)/100;if(Math.abs(r-0.5)<0.01)return '½';if(Math.abs(r-0.25)<0.01)return '¼';if(Number.isInteger(r))return String(r);return r.toLocaleString('pt-BR',{maximumFractionDigits:1})};
export function formatQty(amount:number,unit:Unit){
 if(unit==='agosto')return 'a gosto';
 if(unit==='g'||unit==='ml'){const v=amount>=100?Math.round(amount/5)*5:Math.round(amount);return `${v} ${unit}`}
 const [one,many]=UNIT_LABEL[unit];return `${fmtNum(amount)} ${amount>1?many:one}`;
}
export function ingredientName(spec:IngredientSpec){return spec.label||getFood(spec.food)?.name||spec.food}
