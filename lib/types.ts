import {z} from 'zod';
import {COLORS,DISH_KEYS,type ColorKey} from './catalog';

export const PEOPLE=['pessoa1','pessoa2'] as const;
export type PersonId=typeof PEOPLE[number];
export type ForWho='ambos'|PersonId;
const forWho=z.enum(['ambos','pessoa1','pessoa2']);

const tagList=z.array(z.string().trim().min(1).max(60)).max(30);
export const profileSchema=z.object({
 name:z.string().max(40),
 avatar:z.string().max(16),
 color:z.enum(Object.keys(COLORS) as [ColorKey,...ColorKey[]]),
 goal:z.string().max(160),
 likes:tagList,
 avoids:tagList,
 intolerances:tagList,
 allergies:tagList,
 celiac:z.boolean(),
 cookTime:z.enum(['rapido','medio','sem_pressa']),
 meals:z.enum(['2','3','4','5+']),
 budget:z.enum(['economico','moderado','livre']),
 style:z.enum(['simples','elaborado']),
 notes:z.string().max(400),
 // Dados corporais: opcionais, só seguem para a IA quando useBody estiver ligado.
 body:z.object({weight:z.string().max(10),height:z.string().max(10),activity:z.string().max(80)}),
 useBody:z.boolean(),
});
export type Profile=z.infer<typeof profileSchema>;
export const profilesSchema=z.object({pessoa1:profileSchema,pessoa2:profileSchema});
export type Profiles=z.infer<typeof profilesSchema>;

export const ingredientSchema=z.object({name:z.string().max(80),qty:z.string().max(40),have:z.boolean()});
export const suggestionSchema=z.object({
 id:z.string().max(40),
 title:z.string().min(1).max(120),
 description:z.string().max(400),
 minutes:z.number().int().min(0).max(600),
 difficulty:z.enum(['facil','media','elaborada']),
 image:z.enum(DISH_KEYS),
 mode:z.enum(['casa','delivery']),
 forWho,
 ingredients:z.array(ingredientSchema).max(30),
 steps:z.array(z.string().max(500)).max(20),
 substitutions:z.array(z.string().max(240)).max(10),
 portions:z.object({pessoa1:z.string().max(240),pessoa2:z.string().max(240)}),
 adaptations:z.object({pessoa1:z.string().max(300),pessoa2:z.string().max(300)}),
 highlights:z.array(z.string().max(40)).max(5),
 nutrition:z.string().max(240),
 cautions:z.array(z.string().max(300)).max(6),
 askRestaurant:z.array(z.string().max(200)).max(6),
});
export type Suggestion=z.infer<typeof suggestionSchema>;

export const DAYS=[{key:'seg',short:'Seg',label:'Segunda'},{key:'ter',short:'Ter',label:'Terça'},{key:'qua',short:'Qua',label:'Quarta'},{key:'qui',short:'Qui',label:'Quinta'},{key:'sex',short:'Sex',label:'Sexta'},{key:'sab',short:'Sáb',label:'Sábado'},{key:'dom',short:'Dom',label:'Domingo'}] as const;
export const MEALS=[{key:'cafe',label:'Café da manhã'},{key:'almoco',label:'Almoço'},{key:'lanche',label:'Lanche'},{key:'jantar',label:'Jantar'}] as const;
export type DayKey=typeof DAYS[number]['key'];
export type MealKey=typeof MEALS[number]['key'];
export const planEntrySchema=z.object({recipe:suggestionSchema,forWho,done:z.boolean()});
export type PlanEntry=z.infer<typeof planEntrySchema>;
export const planSchema=z.record(z.string().regex(/^(seg|ter|qua|qui|sex|sab|dom)-(cafe|almoco|lanche|jantar)$/),planEntrySchema);
export type Plan=Record<string,PlanEntry>;
export const slotKey=(d:DayKey,m:MealKey)=>`${d}-${m}`;

export const shoppingItemSchema=z.object({id:z.string().max(40),name:z.string().min(1).max(80),done:z.boolean(),source:z.string().max(120)});
export type ShoppingItem=z.infer<typeof shoppingItemSchema>;

// Estado que sincroniza entre aparelhos (Neon) ou fica no aparelho quando não há banco.
export const statePatchSchema=z.object({
 profiles:profilesSchema.optional(),
 saved:z.array(suggestionSchema).max(200).optional(),
 plan:planSchema.optional(),
 shopping:z.array(shoppingItemSchema).max(300).optional(),
});
export type SharedState={profiles:Profiles,saved:Suggestion[],plan:Plan,shopping:ShoppingItem[]};
export type StateKey=keyof SharedState;

export const HUNGER=[
 {value:0,label:'Sem fome',hint:'Algo leve, só para acompanhar'},
 {value:1,label:'Um pouco de fome',hint:'Um lanche caprichado'},
 {value:2,label:'Fome normal',hint:'Uma refeição completa'},
 {value:3,label:'Muita fome',hint:'Prato bem servido'},
 {value:4,label:'Muita, muita fome',hint:'Refeição reforçada'},
] as const;

export const CRAVINGS=[{key:'caseira',label:'Comida caseira'},{key:'japones',label:'Japonês'},{key:'hamburguer',label:'Hambúrguer'},{key:'marmita',label:'Marmita'},{key:'saladas',label:'Saladas e bowls'},{key:'tanto_faz',label:'Tanto faz'}] as const;
export const BUDGETS=[{key:'ate25',label:'Até R$ 25'},{key:'25a40',label:'R$ 25 a R$ 40'},{key:'40a60',label:'R$ 40 a R$ 60'},{key:'livre',label:'Sem limite definido'}] as const;

const shortText=z.string().trim().min(1).max(60);
const aiProfile=profileSchema.pick({name:true,goal:true,likes:true,avoids:true,intolerances:true,allergies:true,celiac:true,cookTime:true,budget:true,style:true,notes:true,body:true,useBody:true});
export const suggestRequestSchema=z.object({
 kind:z.enum(['cozinhar','surpresa','delivery','trocar','plano']),
 forWho,
 ingredients:z.array(z.object({name:shortText,qty:z.string().max(30)})).max(40),
 hunger:z.object({pessoa1:z.number().int().min(0).max(4).optional(),pessoa2:z.number().int().min(0).max(4).optional()}),
 time:z.enum(['rapido','normal']),
 craving:z.enum(['caseira','japones','hamburguer','marmita','saladas','tanto_faz']).optional(),
 budget:z.enum(['ate25','25a40','40a60','livre']).optional(),
 mealType:z.enum(['cafe','almoco','lanche','jantar']).optional(),
 exclude:z.array(z.string().max(120)).max(30),
 count:z.number().int().min(1).max(3),
 profiles:z.object({pessoa1:aiProfile,pessoa2:aiProfile}),
});
export type SuggestRequest=z.infer<typeof suggestRequestSchema>;
export type SuggestResponse={intro:string,suggestions:Suggestion[],tip:string,notice:string,fallback:boolean};
