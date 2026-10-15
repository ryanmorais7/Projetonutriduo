import type {MealKey} from './types';

const toMin=(hhmm:string)=>{const [h,m]=hhmm.split(':').map(Number);return h*60+(m||0)};

// Refeição do momento pelo relógio do aparelho (já no fuso local da pessoa) e pela rotina cadastrada.
// Café: do horário de acordar até ~3h depois (ou 10h30). Almoço: 11h–15h. Tarde: 15h–18h30. Depois, jantar.
export function mealNow(routine:{wake:string,sleep:string}={wake:'07:00',sleep:'23:00'},date=new Date()):MealKey{
 const now=date.getHours()*60+date.getMinutes();
 const wake=toMin(routine.wake);
 const breakfastEnd=Math.max(wake+180,630);
 if(now>=wake-60&&now<breakfastEnd)return 'cafe';
 if(now>=breakfastEnd&&now<15*60)return 'almoco';
 if(now>=15*60&&now<18*60+30)return 'lanche';
 if(now<wake-60)return 'lanche'; // madrugada: algo leve
 return 'jantar';
}
// Minutos até o horário de dormir (usado só como contexto; refeição maior à noite não é "proibida").
export function minutesToSleep(sleep:string,date=new Date()){let d=toMin(sleep)-(date.getHours()*60+date.getMinutes());if(d<-120)d+=1440;return d}
