import {normalizeDiet} from './normalize';
import {COUPLE_FIELDS,type CoupleFood,type PersonId,type PersonKey} from './types';

// Cada dado pessoal fica numa linha própria do banco: "<pessoa>:<chave>". Nada de documento compartilhado.
export const personKey=(id:PersonId,key:PersonKey)=>`${id}:${key}`;
export const PUBLIC_KEY='public';

// O que o modo casal pode ler do outro perfil: só preferências e restrições alimentares
// (nunca peso, altura, observações, rotina, favoritos, plano, treinos ou histórico).
export function coupleView(rawDiet:unknown,id:PersonId):CoupleFood{
 const d=normalizeDiet(rawDiet,id);
 return Object.fromEntries(COUPLE_FIELDS.map(k=>[k,d[k]])) as CoupleFood;
}
