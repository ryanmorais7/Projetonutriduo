import {norm} from './catalog';
import type {FoodFlag} from './nutrition/foods';
import type {CoupleFood} from './types';

// Converte restrições declaradas em texto livre nas marcações do banco de alimentos.
// Intolerância à lactose bloqueia "lactose"; alergia a leite bloqueia "leite" (inclui leite sem lactose e manteiga).
const KEYWORDS:[RegExp,FoodFlag[]][]=[
 [/lactose/,['lactose']],[/leite|laticin|proteina do leite|caseina/,['leite','lactose']],[/gluten|trigo|celiac/,['gluten']],
 [/\bovo|ovos\b/,['ovo']],[/amendoim/,['amendoim']],[/castanha|\bnoz|nozes|amendoa|caju|avela/,['castanhas']],
 [/camarao|fruto|frutos do mar|crustace|marisco/,['frutos_do_mar']],[/peixe/,['peixe']],[/soja/,['soja']],
];
export function flagsFromText(list:string[]):FoodFlag[]{const out=new Set<FoodFlag>();for(const t of list.map(norm))for(const [re,flags] of KEYWORDS)if(re.test(t))flags.forEach(f=>out.add(f));return [...out]}

export function restrictionFlags(p:Pick<CoupleFood,'intolerances'|'allergies'|'celiac'|'vegetarian'>):FoodFlag[]{
 const out=new Set<FoodFlag>([...flagsFromText(p.intolerances),...flagsFromText(p.allergies)]);
 if(p.celiac)out.add('gluten');
 if(p.vegetarian)(['carne','peixe','frutos_do_mar'] as FoodFlag[]).forEach(f=>out.add(f));
 return [...out];
}

const FLAG_LABEL:Record<string,string>={gluten:'glúten',lactose:'lactose',leite:'leite',ovo:'ovo',carne:'carne',peixe:'peixe',frutos_do_mar:'frutos do mar',amendoim:'amendoim',castanhas:'castanhas',soja:'soja'};
export const flagLabel=(f:string)=>FLAG_LABEL[f]||f;

// Compatibilidade de uma receita com uma ou duas pessoas: usada no selo do card.
export function compatibility(recipe:{flags?:string[],ingredients:{name:string}[]},people:{name:string,diet:Pick<CoupleFood,'intolerances'|'allergies'|'celiac'|'vegetarian'|'avoids'>}[]){
 const issues:string[]=[];
 for(const p of people){
  const blocked=restrictionFlags(p.diet).filter(f=>recipe.flags?.includes(f));
  if(blocked.length)issues.push(`${people.length>1?p.name+': ':''}contém ${blocked.map(flagLabel).join(', ')}`);
  const names=recipe.ingredients.map(i=>norm(i.name));
  const disliked=p.diet.avoids.filter(a=>names.some(n=>n.includes(norm(a))));
  if(disliked.length)issues.push(`${people.length>1?p.name+': ':''}leva ${disliked.join(', ').toLowerCase()}`);
 }
 return {ok:!issues.length,issues};
}
export const CROSS_CONTAMINATION='Sem esses ingredientes na receita. Em caso de alergia ou doença celíaca, confira rótulos e o risco de contaminação cruzada.';
