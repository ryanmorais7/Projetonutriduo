import {norm,type DishKey} from './catalog';
import type {Profile,SuggestRequest,Suggestion} from './types';

// Caderno próprio: alimenta o carrossel "Sugestões do momento" e serve de reserva quando a IA não responde.
// "contains" lista alergênicos/grupos para filtrar conforme restrições cadastradas.
type Curated=Suggestion&{contains:string[],meal:('cafe'|'almoco'|'lanche'|'jantar')[]};
const r=(id:string,title:string,image:DishKey,minutes:number,difficulty:Suggestion['difficulty'],description:string,ingredients:[string,string][],steps:string[],o:{highlights:string[],substitutions:string[],contains:string[],meal:Curated['meal'],nutrition?:string,portions?:[string,string]}):Curated=>({
 id,title,image,minutes,difficulty,description,mode:'casa',forWho:'ambos',
 ingredients:ingredients.map(([name,qty])=>({name,qty,have:false})),steps,substitutions:o.substitutions,
 portions:{pessoa1:o.portions?.[0]||'Prato bem servido, ajuste à fome do momento',pessoa2:o.portions?.[1]||'Ajuste à fome do momento'},
 adaptations:{pessoa1:'',pessoa2:''},highlights:o.highlights,nutrition:o.nutrition||'',cautions:[],askRestaurant:[],contains:o.contains,meal:o.meal,
});

export const CURATED:Curated[]=[
 r('c-frango-legumes','Frango grelhado com arroz e legumes','frango',30,'facil','Clássico que nunca erra: frango douradinho, arroz soltinho e legumes no vapor.',
  [['Peito de frango','2 filés'],['Arroz','1 xícara'],['Brócolis','1 maço pequeno'],['Cenoura','1 unidade'],['Alho','2 dentes'],['Limão','1/2 unidade'],['Azeite','1 colher']],
  ['Tempere o frango com alho, limão, sal e pimenta. Deixe 10 minutos.','Cozinhe o arroz como de costume.','Corte brócolis e cenoura e cozinhe no vapor por 6 a 8 minutos.','Grelhe o frango em frigideira bem quente com um fio de azeite, 5 minutos de cada lado.','Fatie o frango e monte os pratos.'],
  {highlights:['Rico em proteína','Sem glúten','Sem lactose'],substitutions:['Frango por tilápia ou tofu','Arroz por batata-doce ou mandioca','Brócolis por abobrinha ou vagem'],contains:[],meal:['almoco','jantar'],nutrition:'Estimativa: boa fonte de proteína por porção; varia com o tamanho do filé.',portions:['2 filés médios, 4 colheres de arroz e legumes à vontade','1 filé médio, 3 colheres de arroz e legumes à vontade']}),
 r('c-prato-feito','Arroz, feijão e ovo com salada','arroz_feijao',20,'facil','O prato feito brasileiro, rápido, completo e reconfortante.',
  [['Arroz','pronto ou 1 xícara'],['Feijão','2 conchas'],['Ovos','2 a 4 unidades'],['Tomate','1 unidade'],['Alface','algumas folhas'],['Cebola','1/4']],
  ['Aqueça o arroz e o feijão.','Frite ou cozinhe os ovos do jeito preferido de cada um.','Fatie tomate e cebola e monte a salada com a alface.','Tempere a salada com azeite, limão e sal.'],
  {highlights:['Proteína + fibras','Sem glúten','Econômico'],substitutions:['Ovo por frango desfiado ou carne moída','Feijão por lentilha ou grão-de-bico'],contains:['ovo'],meal:['almoco','jantar']}),
 r('c-omelete-forno','Omelete de forno com legumes','omelete',25,'facil','Omelete alta e macia, perfeita para aproveitar legumes da geladeira.',
  [['Ovos','4 unidades'],['Tomate','1 unidade'],['Espinafre','1 punhado'],['Cebola','1/2'],['Queijo','50 g (opcional)']],
  ['Preaqueça o forno a 200 °C e unte uma forma pequena.','Bata os ovos com sal e pimenta.','Junte os legumes picados e, se quiser, o queijo.','Asse por 15 a 18 minutos, até firmar e dourar.'],
  {highlights:['Rico em proteína','Sem glúten','Rápido'],substitutions:['Queijo por levedura nutricional (sem lactose)','Espinafre por abobrinha ou couve'],contains:['ovo','lactose'],meal:['cafe','lanche','jantar']}),
 r('c-bowl-carne','Bowl de carne moída com batata-doce','carne',35,'media','Carne moída bem temperada, batata-doce assada e legumes coloridos.',
  [['Carne moída','400 g'],['Batata-doce','2 médias'],['Brócolis','1 maço pequeno'],['Cebola','1 unidade'],['Alho','2 dentes'],['Tomate','1 unidade']],
  ['Asse a batata-doce em cubos a 220 °C por 25 minutos com azeite e sal.','Refogue cebola e alho, junte a carne e doure bem.','Acrescente o tomate picado e cozinhe 5 minutos.','Cozinhe o brócolis no vapor.','Monte os bowls com tudo.'],
  {highlights:['Rico em proteína','Sem glúten','Sem lactose'],substitutions:['Carne moída por frango desfiado','Batata-doce por abóbora ou mandioca'],contains:[],meal:['almoco','jantar'],portions:['Porção generosa de carne e batata','Porção média, com mais legumes se preferir']}),
 r('c-peixe-assado','Peixe assado com batatas e tomate','peixe',35,'facil','Peixe leve e suculento, assado na mesma assadeira das batatas.',
  [['Filé de peixe','2 a 4 filés'],['Batata','3 médias'],['Tomate','2 unidades'],['Limão','1 unidade'],['Azeite','2 colheres'],['Cheiro-verde','a gosto']],
  ['Preaqueça o forno a 200 °C.','Corte as batatas em rodelas finas e asse por 15 minutos com azeite.','Tempere o peixe com limão e sal.','Coloque o peixe e o tomate sobre as batatas e asse mais 15 minutos.','Finalize com cheiro-verde.'],
  {highlights:['Proteína magra','Sem glúten','Sem lactose'],substitutions:['Peixe por frango em tiras','Batata por abobrinha'],contains:['peixe'],meal:['almoco','jantar']}),
 r('c-panqueca-banana','Panqueca de banana com aveia','cafe',15,'facil','Café da manhã docinho sem açúcar adicionado, pronto em minutos.',
  [['Banana','1 madura'],['Ovos','2 unidades'],['Aveia','3 colheres'],['Canela','a gosto'],['Mel','opcional']],
  ['Amasse a banana e misture com os ovos e a aveia.','Aqueça uma frigideira antiaderente untada.','Despeje porções pequenas e doure 2 minutos de cada lado.','Sirva com canela, frutas ou um fio de mel.'],
  {highlights:['Fonte de fibras','Sem lactose','Rápido'],substitutions:['Aveia por farinha de arroz ou aveia certificada sem glúten','Mel por frutas picadas'],contains:['ovo','gluten'],meal:['cafe','lanche']}),
 r('c-salada-quinoa','Salada de frango com quinoa e grão-de-bico','salada',25,'facil','Salada que sustenta: quinoa, grão-de-bico, frango e muita cor.',
  [['Quinoa','1 xícara'],['Grão-de-bico cozido','1 xícara'],['Frango','1 filé'],['Pepino','1 unidade'],['Tomate','1 unidade'],['Limão','1 unidade']],
  ['Cozinhe a quinoa em água com sal por 15 minutos e escorra.','Grelhe e desfie ou fatie o frango.','Pique pepino e tomate.','Misture tudo com grão-de-bico, limão, azeite e sal.'],
  {highlights:['Rico em proteína','Sem glúten','Sem lactose'],substitutions:['Quinoa por arroz integral ou cuscuz','Frango por atum ou ovos cozidos'],contains:[],meal:['almoco','jantar','lanche']}),
 r('c-sopa-legumes','Sopa cremosa de legumes com frango','sopa',35,'facil','Sopa aconchegante batida no liquidificador, cremosa sem creme de leite.',
  [['Abóbora','300 g'],['Batata','1 média'],['Cenoura','1 unidade'],['Frango','1 filé'],['Cebola','1/2'],['Alho','2 dentes']],
  ['Refogue cebola e alho.','Junte legumes em cubos e o frango, cubra com água e cozinhe 25 minutos.','Retire o frango e desfie.','Bata os legumes com o caldo e volte o frango desfiado.'],
  {highlights:['Leve','Sem glúten','Sem lactose'],substitutions:['Frango por lentilha (versão vegetariana)','Abóbora por mandioquinha'],contains:[],meal:['jantar','almoco']}),
 r('c-mandioca-frango','Mandioca cozida com frango desfiado','mandioca',40,'media','Comida de casa: mandioca macia e frango desfiado bem temperado.',
  [['Mandioca','500 g'],['Frango','2 filés'],['Tomate','2 unidades'],['Cebola','1 unidade'],['Cheiro-verde','a gosto']],
  ['Cozinhe a mandioca na pressão por 15 minutos.','Cozinhe o frango e desfie.','Refogue cebola e tomate, junte o frango e ajuste o sal.','Sirva a mandioca com o frango e cheiro-verde.'],
  {highlights:['Sem glúten','Sem lactose','Bem brasileiro'],substitutions:['Mandioca por batata ou inhame','Frango por carne moída'],contains:[],meal:['almoco','jantar']}),
 r('c-ovos-tomate','Ovos mexidos com tomate','ovos',10,'facil','Ovos cremosos com tomate refogado: rápido, barato e saboroso.',
  [['Ovos','4 unidades'],['Tomate','2 unidades'],['Cebolinha','a gosto'],['Pão ou tapioca','para acompanhar']],
  ['Refogue o tomate picado com uma pitada de sal até amolecer.','Junte os ovos batidos e mexa em fogo baixo até ficar cremoso.','Finalize com cebolinha.','Sirva com pão, tapioca ou arroz.'],
  {highlights:['Rico em proteína','Rápido','Econômico'],substitutions:['Pão por tapioca (sem glúten)'],contains:['ovo','gluten'],meal:['cafe','lanche','jantar']}),
];

const restrictionTerms=(p:Pick<Profile,'avoids'|'intolerances'|'allergies'|'celiac'>)=>[...p.avoids,...p.intolerances,...p.allergies,...(p.celiac?['gluten']:[])].map(norm);
const conflicts=(c:Curated,terms:string[])=>terms.some(t=>c.contains.some(x=>t.includes(x)||x.includes(t))||c.ingredients.some(i=>norm(i.name).includes(t)));

export function mealOfDay(date=new Date()):'cafe'|'almoco'|'lanche'|'jantar'{const h=date.getHours();return h<10?'cafe':h<15?'almoco':h<18?'lanche':'jantar'}

export function curatedFor(profiles:Pick<Profile,'avoids'|'intolerances'|'allergies'|'celiac'>[],meal=mealOfDay()):Suggestion[]{
 const terms=profiles.flatMap(restrictionTerms).filter(t=>t.length>2);
 const ok=CURATED.filter(c=>!conflicts(c,terms));
 return [...ok.filter(c=>c.meal.includes(meal)),...ok.filter(c=>!c.meal.includes(meal))].map(({contains,meal:_m,...s})=>s);
}

const DELIVERY:Record<string,[string,DishKey,string,string[]][]>={
 caseira:[['Prato feito com proteína grelhada','arroz_feijao','Arroz, feijão, uma proteína grelhada e salada.',['A proteína é grelhada ou frita?','Dá para trocar a fritura por salada ou legumes?']],['Frango assado com acompanhamentos','frango','Frango assado com legumes e arroz.',['O tempero leva algum ingrediente que eu precise evitar?']]],
 japones:[['Combinado com sashimi e temaki','japones','Mais peças de peixe e menos fritas; arroz na medida da fome.',['O shoyu tem versão sem glúten?','Quais peças levam cream cheese ou empanados?']],['Yakisoba de frango com legumes','frango_arroz','Peça com mais legumes e molho à parte.',['O molho leva trigo?']]],
 hamburguer:[['Hambúrguer com salada e acompanhamento assado','hamburguer','Um hambúrguer simples, salada e batata assada no lugar da frita quando houver.',['Tem pão sem glúten ou opção no prato?','O molho especial leva leite ou ovo?']]],
 marmita:[['Marmita fit de frango com legumes','marmita','Proteína, carboidrato e legumes bem divididos.',['Quais ingredientes vão no tempero?','Tem opção sem lactose?']],['Marmita caseira de carne com arroz e feijão','caseira','Comida de casa para quem quer sustância.',['Dá para pedir mais salada?']]],
 saladas:[['Bowl com grão, proteína e folhas','bowl','Escolha uma proteína, um grão e muitos vegetais; molho à parte.',['O molho tem lactose ou glúten?','Os croutons podem sair?']],['Salada completa com frango','salada','Folhas, frango grelhado e grãos para dar saciedade.',['Posso adicionar ovo ou grão-de-bico?']]],
};
export function fallbackSuggestions(req:SuggestRequest):Suggestion[]{
 const ex=new Set(req.exclude.map(norm));
 if(req.kind==='delivery'){
  const pool=req.craving&&req.craving!=='tanto_faz'?DELIVERY[req.craving]:Object.values(DELIVERY).flat();
  return pool.filter(([t])=>!ex.has(norm(t))).slice(0,req.count).map(([title,image,description,ask],i)=>({id:`d-${i}-${Date.now()}`,title,image,description,minutes:0,difficulty:'facil',mode:'delivery',forWho:req.forWho,ingredients:[],steps:['Monte o pedido com uma fonte de proteína, um acompanhamento e legumes ou salada.','Peça molhos à parte para controlar o sabor e o que vai no prato.','Confira no app de delivery os ingredientes e o preço atual antes de fechar.'],substitutions:[],portions:{pessoa1:'',pessoa2:''},adaptations:{pessoa1:'',pessoa2:''},highlights:['Sugestão de pedido'],nutrition:'',cautions:['Sugestão de tipo de prato, não de restaurante real. Confirme ingredientes com o estabelecimento.'],askRestaurant:ask}));
 }
 const people=req.forWho==='ambos'?[req.profiles.pessoa1,req.profiles.pessoa2]:[req.profiles[req.forWho]];
 const have=req.ingredients.map(i=>norm(i.name));
 const pool=curatedFor(people,req.mealType).filter(c=>!ex.has(norm(c.title)));
 const score=(s:Suggestion)=>s.ingredients.filter(i=>have.some(h=>norm(i.name).includes(h)||h.includes(norm(i.name)))).length;
 return pool.sort((a,b)=>score(b)-score(a)).slice(0,req.count).map(s=>({...s,id:`${s.id}-${Date.now().toString(36)}`,forWho:req.forWho,ingredients:s.ingredients.map(i=>({...i,have:have.some(h=>norm(i.name).includes(h)||h.includes(norm(i.name)))}))}));
}
