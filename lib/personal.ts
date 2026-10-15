import {restrictionFlags} from './restrictions';
import type {AIPerson,CoupleFood,DietProfile,RecipeSearch} from './types';

// Parâmetros "personalizados pelo perfil" para a busca no catálogo: só das pessoas envolvidas no momento.
export function personalFilter(diets:(CoupleFood&{hidden?:string[]})[]):NonNullable<RecipeSearch['personal']>{
 return {
  flags:[...new Set(diets.flatMap(restrictionFlags))],
  avoid:[...new Set(diets.flatMap(d=>d.avoids))].slice(0,30),
  likes:[...new Set(diets.flatMap(d=>d.likes))].slice(0,30),
  hidden:[...new Set(diets.flatMap(d=>d.hidden||[]))].slice(0,300),
 };
}

// Perfil enviado à IA: dados corporais e observações só da própria pessoa e só se ela autorizou.
export function aiPersonFrom(name:string,food:CoupleFood,own?:DietProfile,hunger?:number):AIPerson{
 return {
  name,goals:food.goals,goal:food.goal,likes:food.likes,avoids:food.avoids,intolerances:food.intolerances,allergies:food.allergies,
  celiac:food.celiac,vegetarian:food.vegetarian,cookTime:food.cookTime,style:food.style,budget:food.budget,breakfast:food.breakfast,
  hunger,body:own?.useBody?own.body:undefined,notes:own?.notes||undefined,
 };
}
