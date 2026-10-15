import type {DishKey} from '../catalog';
import {parseSpec,type IngredientSpec} from '../nutrition/calc';

export type MealCat='cafe'|'almoco'|'lanche'|'jantar'|'extra';
export type Difficulty='facil'|'media'|'elaborada';
export type RecipeData={
 id:string,title:string,cat:MealCat,also:MealCat[],minutes:number,difficulty:Difficulty,servings:number,
 photo:DishKey|null,description:string,ingredients:IngredientSpec[],steps:string[],tags:string[],subs:string[],
};
type Opts={tags?:string,subs?:string,also?:string};
const DIFF={f:'facil',m:'media',e:'elaborada'} as const;

// Fábrica por categoria. Ingredientes separados por ";" (notação de parseSpec), passos por "|".
// O id final fica "<categoria>-<slug>" e nunca deve mudar depois de publicado (favoritos e planos guardam o id).
export const recipeFactory=(cat:MealCat)=>(slug:string,title:string,minutes:number,diff:keyof typeof DIFF,servings:number,photo:DishKey|null,description:string,ing:string,steps:string,o:Opts={}):RecipeData=>({
 id:`${cat}-${slug}`,title,cat,minutes,difficulty:DIFF[diff],servings,photo,description,
 ingredients:ing.split(';').map(s=>s.trim()).filter(Boolean).map(parseSpec),
 steps:steps.split('|').map(s=>s.trim()).filter(Boolean),
 tags:o.tags?o.tags.split(',').map(s=>s.trim()):[],
 subs:o.subs?o.subs.split('|').map(s=>s.trim()):[],
 also:o.also?o.also.split(',').map(s=>s.trim() as MealCat):[],
});
