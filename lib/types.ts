import {z} from 'zod';
import {COLORS,DISH_KEYS,type ColorKey} from './catalog';

export const PEOPLE=['pessoa1','pessoa2'] as const;
export type PersonId=typeof PEOPLE[number];
export type ForWho='ambos'|PersonId;
const forWho=z.enum(['ambos','pessoa1','pessoa2']);
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const tagList=z.array(z.string().trim().min(1).max(60)).max(30);

// ---- Perfil público (o único dado compartilhado entre as duas pessoas: aparece na escolha de perfil)
export const publicProfileSchema=z.object({name:z.string().max(40),avatar:z.string().max(16),color:z.enum(Object.keys(COLORS) as [ColorKey,...ColorKey[]])});
export const publicSchema=z.object({pessoa1:publicProfileSchema,pessoa2:publicProfileSchema});
export type PublicProfile=z.infer<typeof publicProfileSchema>;
export type PublicProfiles=z.infer<typeof publicSchema>;

// ---- Perfil alimentar (privado de cada pessoa)
export const GOALS=[{key:'massa',label:'Recuperar massa muscular'},{key:'equilibrio',label:'Alimentação equilibrada'},{key:'energia',label:'Mais energia no dia'},{key:'disposicao',label:'Disposição para treinar'},{key:'praticidade',label:'Praticidade na rotina'},{key:'leveza',label:'Refeições mais leves'}] as const;
export type GoalKey=typeof GOALS[number]['key'];
export const dietProfileSchema=z.object({
 goals:z.array(z.enum(GOALS.map(g=>g.key) as [GoalKey,...GoalKey[]])).max(6),
 goal:z.string().max(160),
 likes:tagList,avoids:tagList,intolerances:tagList,allergies:tagList,
 celiac:z.boolean(),vegetarian:z.boolean(),
 cookTime:z.enum(['rapido','medio','sem_pressa']),
 meals:z.enum(['2','3','4','5+']),
 budget:z.enum(['economico','moderado','livre']),
 style:z.enum(['simples','elaborado']),
 breakfast:z.enum(['doce','salgado','tanto_faz']),
 notes:z.string().max(400),
 // Opcionais e privados: só seguem para a IA com useBody ligado; nunca viram meta de peso ou calorias.
 body:z.object({weight:z.string().max(10),height:z.string().max(10),age:z.string().max(3),activity:z.string().max(80)}),
 useBody:z.boolean(),
 routine:z.object({wake:time,sleep:time}),
 onboarded:z.boolean(),
 hidden:z.array(z.string().max(60)).max(300),
});
export type DietProfile=z.infer<typeof dietProfileSchema>;
// Subconjunto que pode ser combinado no modo casal: só preferências e restrições alimentares.
export const COUPLE_FIELDS=['goals','goal','likes','avoids','intolerances','allergies','celiac','vegetarian','cookTime','style','budget','breakfast'] as const;
export const coupleFoodSchema=dietProfileSchema.pick({goals:true,goal:true,likes:true,avoids:true,intolerances:true,allergies:true,celiac:true,vegetarian:true,cookTime:true,style:true,budget:true,breakfast:true});
export type CoupleFood=z.infer<typeof coupleFoodSchema>;

// ---- Receitas e sugestões
export const MEAL_CATS=['cafe','almoco','lanche','jantar','extra'] as const;
export type MealCatKey=typeof MEAL_CATS[number];
export const macrosSchema=z.object({kcal:z.number(),protein:z.number(),carbs:z.number(),fat:z.number(),status:z.enum(['completo','indisponivel'])});
export const ingredientSchema=z.object({name:z.string().max(80),qty:z.string().max(40),have:z.boolean()});
export const suggestionSchema=z.object({
 id:z.string().max(60),
 title:z.string().min(1).max(120),
 description:z.string().max(400),
 minutes:z.number().int().min(0).max(600),
 difficulty:z.enum(['facil','media','elaborada']),
 image:z.enum(DISH_KEYS).nullable(),
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
 // Campos do catálogo (opcionais para manter compatíveis as sugestões antigas e as de delivery)
 recipeId:z.string().max(60).optional(),
 source:z.enum(['catalogo','ia','delivery']).optional(),
 category:z.enum(MEAL_CATS).optional(),
 servings:z.number().min(1).max(30).optional(),
 macros:macrosSchema.optional(),
 thumbs:z.array(z.string().max(40)).max(3).optional(),
 flags:z.array(z.string().max(20)).max(12).optional(),
 why:z.string().max(300).optional(),
});
export type Suggestion=z.infer<typeof suggestionSchema>;

export const DAYS=[{key:'seg',short:'Seg',label:'Segunda'},{key:'ter',short:'Ter',label:'Terça'},{key:'qua',short:'Qua',label:'Quarta'},{key:'qui',short:'Qui',label:'Quinta'},{key:'sex',short:'Sex',label:'Sexta'},{key:'sab',short:'Sáb',label:'Sábado'},{key:'dom',short:'Dom',label:'Domingo'}] as const;
export const MEALS=[{key:'cafe',label:'Café da manhã'},{key:'almoco',label:'Almoço'},{key:'lanche',label:'Lanche'},{key:'jantar',label:'Jantar'}] as const;
export type DayKey=typeof DAYS[number]['key'];
export type MealKey=typeof MEALS[number]['key'];
const dayKey=z.string().regex(/^(seg|ter|qua|qui|sex|sab|dom)$/);
export const planEntrySchema=z.object({recipe:suggestionSchema,forWho,done:z.boolean()});
export type PlanEntry=z.infer<typeof planEntrySchema>;
export const planSchema=z.record(z.string().regex(/^(seg|ter|qua|qui|sex|sab|dom)-(cafe|almoco|lanche|jantar)$/),planEntrySchema);
export type Plan=Record<string,PlanEntry>;
export const slotKey=(d:DayKey,m:MealKey)=>`${d}-${m}`;
export const shoppingItemSchema=z.object({id:z.string().max(40),name:z.string().min(1).max(80),done:z.boolean(),source:z.string().max(120)});
export type ShoppingItem=z.infer<typeof shoppingItemSchema>;

// ---- Exercícios
export const REGIONS=[{key:'joelho',label:'Joelho'},{key:'coluna',label:'Coluna / lombar'},{key:'ombro',label:'Ombro'},{key:'punho',label:'Punho / mão'},{key:'quadril',label:'Quadril'},{key:'tornozelo',label:'Tornozelo / pé'},{key:'abdomen',label:'Abdômen / cirurgia abdominal'},{key:'coracao',label:'Coração / pressão'}] as const;
export type Region=typeof REGIONS[number]['key'];
export const FOCI=[{key:'corpo',label:'Corpo inteiro'},{key:'pernas',label:'Pernas e glúteos'},{key:'core',label:'Abdômen e core'},{key:'cardio',label:'Cardio'},{key:'esteira',label:'Esteira'},{key:'bicicleta',label:'Bicicleta ergométrica'},{key:'mobilidade',label:'Mobilidade'}] as const;
export type Focus=typeof FOCI[number]['key'];
export const EQUIPMENT=[{key:'esteira',label:'Esteira'},{key:'bicicleta',label:'Bicicleta ergométrica'},{key:'cadeira',label:'Cadeira firme'},{key:'tapete',label:'Tapete / colchonete'},{key:'garrafas',label:'Garrafas de água como peso'}] as const;
export type Equipment=typeof EQUIPMENT[number]['key'];
export const WORKOUT_MINUTES=[10,15,20,30,45] as const;
export const exerciseProfileSchema=z.object({
 // nao_respondido: ainda não passou pelas perguntas de segurança (nenhum treino é montado)
 // recuperacao: sem liberação profissional (ex.: pós-cirurgia) → só organização de orientações e conteúdo educativo
 clearance:z.enum(['nao_respondido','liberado','nao_sei','recuperacao']),
 limits:z.array(z.enum(REGIONS.map(r=>r.key) as [Region,...Region[]])).max(8),
 pain:z.boolean(),
 equipment:z.array(z.enum(EQUIPMENT.map(e=>e.key) as [Equipment,...Equipment[]])).max(5),
 level:z.enum(['iniciante','intermediario']),
 days:z.number().int().min(1).max(6),
 minutes:z.number().int().min(10).max(45),
 guidance:z.array(z.object({id:z.string().max(40),text:z.string().min(1).max(200),done:z.boolean()})).max(30),
 notes:z.string().max(400),
 week:z.record(dayKey,z.object({kind:z.enum(['treino','descanso','leve']),focus:z.enum(FOCI.map(f=>f.key) as [Focus,...Focus[]]),minutes:z.number().int().min(5).max(60)})),
 answeredAt:z.string().max(30),
});
export type ExerciseProfile=z.infer<typeof exerciseProfileSchema>;
export const sessionSchema=z.object({id:z.string().max(40),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),title:z.string().max(80),focus:z.enum(FOCI.map(f=>f.key) as [Focus,...Focus[]]),minutes:z.number().int().min(0).max(180),exercises:z.array(z.string().max(40)).max(60),feeling:z.enum(['facil','ok','dificil']).nullable()});
export type Session=z.infer<typeof sessionSchema>;

// ---- Estado por pessoa (cada chave é gravada separadamente: "<pessoa>:<chave>")
export const PERSON_KEYS=['diet','saved','later','plan','shopping','exercise','sessions'] as const;
export type PersonKey=typeof PERSON_KEYS[number];
export const personPatchSchema=z.object({
 diet:dietProfileSchema.optional(),
 saved:z.array(suggestionSchema).max(200).optional(),
 later:z.array(suggestionSchema).max(100).optional(),
 plan:planSchema.optional(),
 shopping:z.array(shoppingItemSchema).max(300).optional(),
 exercise:exerciseProfileSchema.optional(),
 sessions:z.array(sessionSchema).max(300).optional(),
});
export type PersonState={diet:DietProfile,saved:Suggestion[],later:Suggestion[],plan:Plan,shopping:ShoppingItem[],exercise:ExerciseProfile,sessions:Session[]};
export const statePutSchema=z.object({person:z.enum(PEOPLE),patch:personPatchSchema.optional(),public:publicSchema.optional()});

// ---- Pedidos às rotas
export const HUNGER=[{value:0,label:'Sem fome',hint:'Algo leve, só para acompanhar'},{value:1,label:'Um pouco de fome',hint:'Um lanche caprichado'},{value:2,label:'Fome normal',hint:'Uma refeição completa'},{value:3,label:'Muita fome',hint:'Prato bem servido'},{value:4,label:'Muita, muita fome',hint:'Refeição reforçada'}] as const;
export const CRAVINGS=[{key:'caseira',label:'Comida caseira'},{key:'japones',label:'Japonês'},{key:'hamburguer',label:'Hambúrguer'},{key:'marmita',label:'Marmita'},{key:'saladas',label:'Saladas e bowls'},{key:'tanto_faz',label:'Tanto faz'}] as const;
export const BUDGETS=[{key:'ate25',label:'Até R$ 25'},{key:'25a40',label:'R$ 25 a R$ 40'},{key:'40a60',label:'R$ 40 a R$ 60'},{key:'livre',label:'Sem limite definido'}] as const;
export const INTENTS=[{key:'leve',label:'Quero algo leve'},{key:'satisfeito',label:'Quero ficar satisfeito'},{key:'fome',label:'Tenho muita fome'},{key:'rapido',label:'Preciso de algo rápido'},{key:'treino',label:'Treinei hoje'},{key:'casa',label:'Usar o que tenho em casa'}] as const;
export type Intent=typeof INTENTS[number]['key'];

const aiPerson=coupleFoodSchema.extend({
 name:z.string().max(40),
 hunger:z.number().int().min(0).max(4).optional(),
 body:z.object({weight:z.string().max(10),height:z.string().max(10),age:z.string().max(3),activity:z.string().max(80)}).optional(),
 notes:z.string().max(400).optional(),
});
export type AIPerson=z.infer<typeof aiPerson>;
export const suggestRequestSchema=z.object({
 kind:z.enum(['cozinhar','surpresa','delivery','trocar','plano','horario']),
 forWho,
 ingredients:z.array(z.object({name:z.string().trim().min(1).max(60),qty:z.string().max(30)})).max(40),
 time:z.enum(['rapido','normal']),
 meal:z.enum(['cafe','almoco','lanche','jantar']).optional(),
 intent:z.enum(['leve','satisfeito','fome','rapido','treino','casa']).optional(),
 trained:z.boolean().optional(),
 sleep:time.optional(),
 craving:z.enum(['caseira','japones','hamburguer','marmita','saladas','tanto_faz']).optional(),
 budget:z.enum(['ate25','25a40','40a60','livre']).optional(),
 exclude:z.array(z.string().max(120)).max(300),
 count:z.number().int().min(1).max(6),
 profiles:z.object({pessoa1:aiPerson.optional(),pessoa2:aiPerson.optional()}),
}).refine(d=>d.forWho==='ambos'?!!(d.profiles.pessoa1&&d.profiles.pessoa2):!!d.profiles[d.forWho],{message:'Perfil ausente para o pedido.'});
export type SuggestRequest=z.infer<typeof suggestRequestSchema>;
export type SuggestResponse={intro:string,suggestions:Suggestion[],tip:string,notice:string,fallback:boolean};

export const RECIPE_GOALS=[{key:'equilibrada',label:'Alimentação equilibrada'},{key:'proteica',label:'Rica em proteínas'},{key:'energetica',label:'Mais energética'},{key:'leve',label:'Mais leve em volume'},{key:'economica',label:'Econômica'}] as const;
export const recipeSearchSchema=z.object({
 q:z.string().max(60).optional(),
 meal:z.enum(['cafe','almoco','lanche','jantar','sobremesa','extra']).optional(),
 maxTime:z.number().int().min(1).max(240).optional(),
 goal:z.enum(['equilibrada','proteica','energetica','leve','economica']).optional(),
 avail:z.enum(['todos','falta1','geladeira','comprar']).optional(),
 have:z.array(z.string().max(60)).max(40).default([]),
 noLactose:z.boolean().optional(),noGluten:z.boolean().optional(),vegetarian:z.boolean().optional(),
 without:z.string().max(40).optional(),
 personal:z.object({flags:z.array(z.string().max(20)).max(12),avoid:z.array(z.string().max(60)).max(30),likes:z.array(z.string().max(60)).max(30),hidden:z.array(z.string().max(60)).max(300)}).optional(),
 tags:z.array(z.string().max(20)).max(5).optional(),
 exclude:z.array(z.string().max(60)).max(300).default([]),
 similarTo:z.string().max(60).optional(),
 seed:z.number().int().optional(),
 page:z.number().int().min(0).max(60).default(0),
 pageSize:z.number().int().min(1).max(24).default(6),
});
export type RecipeSearch=z.input<typeof recipeSearchSchema>;
export type RecipeSearchResult={items:Suggestion[],total:number,hasMore:boolean};

export type IngredientSpecDTO={food:string,amount:number,unit:string,cooked:boolean,label?:string};
export type RecipeDetailDTO={id:string,title:string,description:string,cat:MealCatKey,also:MealCatKey[],minutes:number,difficulty:'facil'|'media'|'elaborada',servings:number,photo:string|null,thumbs:string[],steps:string[],subs:string[],tags:string[],flags:string[],ingredients:IngredientSpecDTO[]};
