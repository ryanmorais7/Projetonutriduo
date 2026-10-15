// Catálogo visual: ingredientes da galeria, fotos ilustrativas de pratos, avatares e cores dos perfis.
// Fotos: TheMealDB (uso gratuito). URLs conferidas uma a uma; a UI sempre tem fallback se alguma falhar.

export type Category='proteinas'|'graos'|'legumes'|'frutas'|'laticinios'|'outros';
export const CATEGORIES:{key:Category,label:string}[]=[
 {key:'proteinas',label:'Proteínas'},{key:'graos',label:'Grãos'},{key:'legumes',label:'Legumes'},
 {key:'frutas',label:'Frutas'},{key:'laticinios',label:'Laticínios'},{key:'outros',label:'Outros'},
];

export type CatalogItem={id:string,name:string,category:Category,img?:string,aliases:string[]};
const item=(id:string,name:string,category:Category,img?:string,aliases:string[]=[]):CatalogItem=>({id,name,category,img,aliases});

export const INGREDIENTS:CatalogItem[]=[
 item('frango','Frango','proteinas','Chicken Breast',['peito de frango','coxa','sobrecoxa','file de frango']),
 item('ovos','Ovos','proteinas','Eggs',['ovo']),
 item('carne','Carne bovina','proteinas','Beef',['bife','patinho','alcatra','contrafile','acem','carne']),
 item('carne-moida','Carne moída','proteinas','Minced Beef',['carne moida']),
 item('peixe','Peixe','proteinas','White Fish',['tilapia','merluza','pescada','file de peixe']),
 item('salmao','Salmão','proteinas','Salmon'),
 item('atum','Atum','proteinas','Tuna'),
 item('sardinha','Sardinha','proteinas','Sardines'),
 item('camarao','Camarão','proteinas','Prawns'),
 item('porco','Carne de porco','proteinas','Pork',['lombo','bisteca','porco']),
 item('presunto','Presunto','proteinas','Ham'),
 item('tofu','Tofu','proteinas','Tofu'),
 item('arroz','Arroz','graos','Rice'),
 item('arroz-integral','Arroz integral','graos','Brown Rice'),
 item('feijao','Feijão','graos','Black Beans',['feijao preto','feijao carioca']),
 item('feijao-vermelho','Feijão vermelho','graos','Kidney Beans'),
 item('lentilha','Lentilha','graos','Lentils'),
 item('grao-de-bico','Grão-de-bico','graos','Chickpeas',['grao de bico']),
 item('quinoa','Quinoa','graos','Quinoa'),
 item('aveia','Aveia','graos','Oats'),
 item('pao','Pão','graos','Bread',['pao frances','pao integral']),
 item('macarrao','Macarrão','graos','Spaghetti',['massa','espaguete','penne']),
 item('cuscuz','Cuscuz','graos','Couscous'),
 item('tapioca','Tapioca','graos',undefined,['goma de tapioca']),
 item('fuba','Fubá / flocão','graos','Corn Flour',['flocao','farinha de milho']),
 item('wrap','Wrap / rap10','graos','Tortillas',['tortilha','rap10']),
 item('batata','Batata','legumes','Potatoes'),
 item('batata-doce','Batata-doce','legumes','Sweet Potatoes',['batata doce']),
 item('mandioca','Mandioca','legumes','Cassava',['aipim','macaxeira']),
 item('tomate','Tomate','legumes','Tomato'),
 item('cenoura','Cenoura','legumes','Carrots'),
 item('cebola','Cebola','legumes','Onion'),
 item('alho','Alho','legumes','Garlic'),
 item('brocolis','Brócolis','legumes','Broccoli'),
 item('alface','Alface','legumes','Lettuce',['salada verde']),
 item('pepino','Pepino','legumes','Cucumber'),
 item('abobrinha','Abobrinha','legumes','Courgettes'),
 item('abobora','Abóbora','legumes','Pumpkin',['jerimum']),
 item('espinafre','Espinafre','legumes','Spinach'),
 item('couve','Couve','legumes','Kale'),
 item('pimentao','Pimentão','legumes','Red Pepper'),
 item('repolho','Repolho','legumes','Cabbage'),
 item('cogumelos','Cogumelos','legumes','Mushrooms',['champignon','cogumelo']),
 item('beterraba','Beterraba','legumes','Beetroot'),
 item('milho','Milho','legumes','Sweetcorn'),
 item('ervilha','Ervilha','legumes','Peas'),
 item('vagem','Vagem','legumes','Green Beans'),
 item('banana','Banana','frutas','Banana'),
 item('maca','Maçã','frutas'),
 item('laranja','Laranja','frutas','Orange'),
 item('morango','Morango','frutas','Strawberries'),
 item('manga','Manga','frutas','Mango'),
 item('limao','Limão','frutas','Lemon'),
 item('abacate','Abacate','frutas','Avocado'),
 item('mirtilo','Mirtilo','frutas','Blueberries'),
 item('coco','Coco','frutas','Coconut'),
 item('leite','Leite','laticinios','Milk'),
 item('queijo','Queijo','laticinios','Cheese',['queijo minas','queijo coalho']),
 item('mucarela','Muçarela','laticinios','Mozzarella',['mussarela']),
 item('iogurte','Iogurte','laticinios','Greek Yogurt'),
 item('requeijao','Requeijão','laticinios','Cream Cheese'),
 item('ricota','Ricota','laticinios','Ricotta'),
 item('manteiga','Manteiga','laticinios','Butter'),
 item('azeite','Azeite','outros','Olive Oil'),
 item('mel','Mel','outros','Honey'),
 item('pasta-amendoim','Pasta de amendoim','outros','Peanut Butter'),
 item('amendoas','Amêndoas','outros','Almonds',['castanha']),
 item('coentro','Coentro / cheiro-verde','outros','Coriander',['cheiro verde','salsinha']),
 item('gengibre','Gengibre','outros','Ginger'),
 item('farinha','Farinha de trigo','outros','Flour'),
];

export const ingredientImage=(img?:string)=>img?`https://www.themealdb.com/images/ingredients/${encodeURIComponent(img)}-small.png`:undefined;

// Fotos de pratos por categoria. São ilustrativas: a IA escolhe a categoria, nunca a foto "exata" do prato.
export const DISHES={
 frango:'kvbotn1581012881',frango_arroz:'wuyd2h1765655837',frango_crocante:'tyywsw1505930373',carne:'m0p0j81765568742',
 feijoada:'xrxz7h1782592711',peixe:'1548772327',camarao:'e2kcut1782591669',ovos:'rwvw8q1765660071',shakshuka:'30s7vf1763741844',
 omelete:'0y6uvc1763258983',salada:'k29viq1585565980',bowl:'z0ageb1583189517',massa:'5fu4ew1760524857',sopa:'yf5eyw1783804464',
 caldo_feijao:'p5nzbk1782680889',vegetariano:'tvtxpq1511464705',lentilha:'wuxrtu1483564410',cafe:'c400ok1764439058',
 hamburguer:'44bzep1761848278',tacos:'uvuyxu1503067369',japones:'xxyupu1468262513',caseira:'fk80jp1763280767',
 marmita:'f0cdwk1782688162',batata:'1550441882',mandioca:'j223gc1784579841',lanche:'sl7cr91782588539',arroz_feijao:'ytogg31784397116',
 // Usadas no catálogo de receitas: só quando o prato da foto é do mesmo tipo da receita.
 banana_panqueca:'sywswr1511383814',omelete_simples:'yvpuuy1511797244',pao_ovo:'hqaejl1695738653',vitamina:'pjbaq11784731571',
 mingau:'sng9bm1765320170',sopa_abobora:'1brbso1763585098',caldo_feijao_preto:'x0mreq1784577446',sopa_ervilha:'xxtsvx1511814083',
 frango_ensopado:'sypxpx1515365095',carne_abobora:'k07k271782502861',estrogonofe:'svprys1511176755',peixe_vapor:'yx8j1i1763484612',
 salada_atum:'yypwwq1511304979',salada_batata_doce:'z458v91763817681',espetinho:'3um6il1763794322',repolho_carne:'brmxra1782681940',
 milho_cozido:'brhaoj1780086661',mousse_abacate:'uttuxy1511382180',bolo_cenoura:'h68o161782679437',banana_assada:'6v583k1780093743',
 lombo:'cybyue1614349443',vagem_carne:'2ncui81784396094',pimentao_recheado:'b66myb1683207208',arroz_camarao:'sl6vqv1763335988',
 camarao_grelhado:'jg4r991779916649',canja:'1529446352',macarrao_frango:'syqypv1486981727',almondegas:'8rfd4q1764112993',canelone:'wspuvp1511303478',
} as const;
export type DishKey=keyof typeof DISHES;
export const DISH_KEYS=Object.keys(DISHES) as [DishKey,...DishKey[]];
// "medium" (350px) para cards pequenos; tamanho cheio onde a foto ocupa a largura da tela.
export const dishImage=(k:DishKey,size:'medium'|'full'='medium')=>`https://www.themealdb.com/images/media/meals/${DISHES[k]??DISHES.caseira}.jpg${size==='medium'?'/medium':''}`;

// Só emojis de um caractere: os compostos (ex.: 🧑‍🍳) viram dois desenhos em alguns sistemas.
export const AVATARS=['💪','🌸','🥑','🍓','🌿','🦋','🐻','🌻','⭐','🍋','🥕','🍳'];
export const COLORS={
 floresta:{label:'Verde-floresta',main:'#2f5d46',soft:'#e1ede4'},
 // Tons escolhidos para texto branco passar de 4,5:1 de contraste (WCAG AA).
 salvia:{label:'Sálvia',main:'#4b7555',soft:'#e6f0e6'},
 coral:{label:'Coral suave',main:'#b8523d',soft:'#fbe7e1'},
 lilas:{label:'Lilás',main:'#8466b0',soft:'#efe8f8'},
 ceu:{label:'Azul-céu',main:'#3b7aa3',soft:'#e2eef6'},
 mel:{label:'Mel',main:'#8f6116',soft:'#f7ecd8'},
} as const;
export type ColorKey=keyof typeof COLORS;

export const norm=(s:string)=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

// Aliases mais longos primeiro, para "batata doce" não virar "batata".
const MATCHERS=INGREDIENTS.flatMap(i=>[norm(i.name),...i.aliases.map(norm)].map(alias=>({alias,item:i}))).sort((a,b)=>b.alias.length-a.alias.length);
export function findIngredient(text:string){const t=` ${norm(text)} `;for(const m of MATCHERS){if(t.includes(` ${m.alias} `)||t.includes(` ${m.alias}s `))return m.item}return undefined}

const NUMBER_WORDS:Record<string,string>={um:'1',uma:'1',dois:'2',duas:'2',tres:'3',quatro:'4',cinco:'5',seis:'6',meio:'½',meia:'½',duzia:'12'};
// Transforma uma frase falada ("tenho arroz, dois ovos e frango congelado") em itens selecionáveis.
export function parseSpoken(text:string):{name:string,qty:string}[]{
 const parts=norm(text).replace(/\b(eu )?(tenho|tem|temos|aqui|tambem|ainda|sobrou|sobraram|um pouco de|algumas?|alguns)\b/g,' ').split(/,|;|\.|\n|\be\b|\bmais\b/);
 const out=new Map<string,{name:string,qty:string}>();
 for(const raw of parts){
  let p=raw.trim();if(p.length<2)continue;
  let qty='';const num=p.match(/^(\d+[.,]?\d*)\s*(kg|g|gramas?|quilos?|litros?|l)?\b/);
  if(num){qty=[num[1],num[2]].filter(Boolean).join(' ');p=p.slice(num[0].length).trim()}
  else{const w=p.split(' ')[0];if(NUMBER_WORDS[w]){qty=NUMBER_WORDS[w];p=p.slice(w.length).trim()}}
  p=p.replace(/^(pacotes?|latas?|potes?|duzias?|unidades?|xicaras?|colheres?)\s+(de\s+)?/,'').replace(/^de\s+/,'').trim();
  if(p.length<2)continue;
  const found=findIngredient(p);const name=found?found.name:p.charAt(0).toUpperCase()+p.slice(1);
  out.set(norm(name),{name,qty});
 }
 return [...out.values()].slice(0,25);
}
