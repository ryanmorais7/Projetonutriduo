// Banco de composição de alimentos usado pelo cálculo nutricional determinístico.
//
// Valores por 100 g da parte comestível, no estado indicado em "ref" (cru, cozido etc.).
// Fontes: TACO – Tabela Brasileira de Composição de Alimentos, 4ª ed. (NEPA/UNICAMP, 2011), priorizada para
// alimentos brasileiros; USDA FoodData Central (SR Legacy) quando o alimento não está na TACO.
// "derivado" = calculado a partir de outro item, com o fator explicado em "ref".
// Gordura saturada: só preenchida quando a fonte traz o valor; caso contrário fica null ("não disponível").
// Os números foram transcritos das tabelas e podem ser auditados pelo nome do item em "ref".
//
// cf (fator de rendimento) = peso preparado ÷ peso cru, usado só para estimar o peso da porção
// quando o ingrediente é marcado como "cozido na receita" (~). Médias de preparo caseiro, aproximadas.

export type FoodFlag='gluten'|'lactose'|'leite'|'ovo'|'carne'|'peixe'|'frutos_do_mar'|'amendoim'|'castanhas'|'soja';
export type Unit='g'|'ml'|'un'|'cs'|'cc'|'xic'|'fatia'|'concha'|'dente'|'file'|'agosto';
export type Per100={kcal:number,protein:number,carbs:number,fat:number,sat:number|null,fiber:number|null,sodium:number|null};
export type Food={
 id:string,name:string,source:'TACO'|'USDA'|'derivado',ref:string,per100:Per100,
 units:Partial<Record<Exclude<Unit,'g'|'ml'|'agosto'>,number>>,density?:number,cf?:number,
 flags:FoodFlag[],group:string,img?:string,staple?:boolean,swap?:string,
};

const T='TACO',U='USDA';
// n(kcal, proteína, carboidrato, gordura, saturada, fibra, sódio)
const n=(kcal:number,protein:number,carbs:number,fat:number,sat:number|null,fiber:number|null,sodium:number|null):Per100=>({kcal,protein,carbs,fat,sat,fiber,sodium});
const f=(id:string,name:string,source:Food['source'],ref:string,per100:Per100,o:Partial<Omit<Food,'id'|'name'|'source'|'ref'|'per100'>>&{group:string}):Food=>({id,name,source,ref,per100,units:{},flags:[],...o});

export const FOODS:Food[]=[
 // Cereais, farinhas e pães
 f('arroz_cru','Arroz branco',T,'Arroz, tipo 1, cru',n(358,7.2,78.8,0.3,null,1.6,1),{group:'arroz',units:{xic:185,cs:15},cf:2.5,img:'Rice',swap:'carbo'}),
 f('arroz','Arroz branco cozido',T,'Arroz, tipo 1, cozido',n(128,2.5,28.1,0.2,null,1.6,1),{group:'arroz',units:{cs:25,xic:160},img:'Rice',swap:'carbo'}),
 f('arroz_int_cru','Arroz integral',T,'Arroz, integral, cru',n(360,7.3,77.5,1.9,null,4.8,2),{group:'arroz',units:{xic:190},cf:2.4,img:'Brown Rice',swap:'carbo'}),
 f('arroz_int','Arroz integral cozido',T,'Arroz, integral, cozido',n(124,2.6,25.8,1.0,null,2.7,1),{group:'arroz',units:{cs:25,xic:160},img:'Brown Rice',swap:'carbo'}),
 f('aveia','Aveia em flocos',T,'Aveia, flocos, crua',n(394,13.9,66.6,8.5,null,9.1,5),{group:'aveia',units:{cs:15,xic:80},flags:['gluten'],img:'Oats'}),
 f('flocao','Flocão de milho',T,'Farinha, de milho, amarela',n(351,7.2,79.1,1.5,null,5.5,45),{group:'cuscuz',units:{xic:100,cs:12},cf:2.0,img:'Corn Flour',swap:'carbo'}),
 f('fuba','Fubá',T,'Fubá, de milho',n(353,7.2,78.9,1.9,null,4.7,0),{group:'cuscuz',units:{cs:12,xic:120},img:'Corn Flour'}),
 f('goma','Goma de tapioca hidratada','derivado','TACO "Polvilho, doce" × 0,68 (goma pronta tem ~32% de água)',n(239,0.3,59.0,0,null,0.1,1),{group:'tapioca',units:{cs:20}}),
 f('pao_frances','Pão francês',T,'Pão, trigo, francês',n(300,8.0,58.6,3.1,null,2.3,648),{group:'pao',units:{un:50},flags:['gluten'],img:'Bread',swap:'pao'}),
 f('pao_integral','Pão de forma integral',T,'Pão, trigo, forma, integral',n(253,9.4,49.9,3.7,null,6.9,506),{group:'pao',units:{fatia:25},flags:['gluten'],img:'Bread',swap:'pao'}),
 f('macarrao','Macarrão de trigo',T,'Macarrão, trigo, cru',n(371,10.0,77.9,1.3,null,2.9,7),{group:'macarrao',units:{xic:100},cf:2.3,flags:['gluten'],img:'Spaghetti'}),
 f('farinha_trigo','Farinha de trigo',T,'Farinha, de trigo',n(360,9.8,75.1,1.4,null,2.3,1),{group:'farinha',units:{cs:9,xic:120},flags:['gluten'],img:'Flour'}),
 f('farinha_mandioca','Farinha de mandioca',T,'Farinha, de mandioca, torrada',n(365,1.2,89.2,0.3,null,6.5,10),{group:'farinha',units:{cs:14}}),
 f('quinoa','Quinoa cozida',U,'Quinoa, cooked',n(120,4.4,21.3,1.9,0.2,2.8,7),{group:'quinoa',units:{cs:17,xic:185},img:'Quinoa',swap:'carbo'}),
 f('milho','Milho verde em conserva',T,'Milho, verde, enlatado, drenado',n(98,3.2,17.1,2.4,null,4.6,260),{group:'milho',units:{cs:22,xic:165},img:'Sweetcorn'}),
 f('milho_espiga','Milho verde cozido',U,'Corn, sweet, yellow, cooked, boiled, without salt',n(96,3.4,21.0,1.5,0.2,2.4,1),{group:'milho',units:{un:100},img:'Sweetcorn'}),
 f('pipoca','Milho de pipoca estourado',U,'Snacks, popcorn, air-popped',n(387,12.9,77.8,4.5,0.6,14.5,8),{group:'milho',units:{xic:8}}),
 // Leguminosas
 f('feijao','Feijão carioca cozido',T,'Feijão, carioca, cozido',n(76,4.8,13.6,0.5,null,8.5,2),{group:'feijao',units:{concha:100,cs:17},img:'Kidney Beans',swap:'leguminosa'}),
 f('feijao_preto','Feijão preto cozido',T,'Feijão, preto, cozido',n(77,4.5,14.0,0.5,null,8.4,2),{group:'feijao',units:{concha:100,cs:17},img:'Black Beans',swap:'leguminosa'}),
 f('fradinho','Feijão-fradinho cozido',T,'Feijão, fradinho, cozido',n(78,5.1,13.5,0.6,null,7.5,1),{group:'feijao',units:{concha:100,cs:17},swap:'leguminosa'}),
 f('lentilha','Lentilha cozida',T,'Lentilha, cozida',n(93,6.3,16.3,0.5,null,7.9,1),{group:'lentilha',units:{concha:100,cs:18},img:'Lentils',swap:'leguminosa'}),
 f('grao_bico','Grão-de-bico cozido',U,'Chickpeas, mature seeds, cooked, boiled, without salt',n(164,8.9,27.4,2.6,0.3,7.6,7),{group:'grao-de-bico',units:{cs:20,xic:160},img:'Chickpeas',swap:'leguminosa'}),
 f('ervilha','Ervilha em conserva',T,'Ervilha, enlatada, drenada',n(74,4.6,13.4,0.4,null,5.1,372),{group:'ervilha',units:{cs:20},img:'Peas'}),
 f('tofu','Tofu firme',U,'Tofu, firm, prepared with calcium sulfate',n(144,17.3,2.8,8.7,1.3,2.3,14),{group:'tofu',flags:['soja'],img:'Tofu',swap:'proteina'}),
 // Raízes, tubérculos e hortaliças
 f('batata','Batata cozida',T,'Batata, inglesa, cozida',n(52,1.2,11.9,0,null,1.3,2),{group:'batata',units:{un:140},img:'Potatoes',swap:'carbo'}),
 f('batata_crua','Batata',T,'Batata, inglesa, crua',n(64,1.8,14.7,0,null,1.2,0),{group:'batata',units:{un:140},cf:0.75,img:'Potatoes',swap:'carbo'}),
 f('batata_doce','Batata-doce cozida',T,'Batata, doce, cozida',n(77,0.6,18.4,0.1,null,2.2,3),{group:'batata-doce',units:{un:150},img:'Sweet Potatoes',swap:'carbo'}),
 f('mandioca','Macaxeira cozida',T,'Mandioca, cozida',n(125,0.6,30.1,0.3,null,1.6,1),{group:'mandioca',img:'Cassava',swap:'carbo'}),
 f('inhame','Inhame',T,'Inhame, cru',n(97,2.1,23.2,0.2,null,1.7,0),{group:'inhame',cf:1.0,swap:'carbo'}),
 f('abobora','Abóbora (jerimum) cozida',T,'Abóbora, cabotian, cozida',n(48,1.4,10.8,0.7,null,2.5,0),{group:'abobora',img:'Pumpkin'}),
 f('cenoura','Cenoura',T,'Cenoura, crua',n(34,1.3,7.7,0.2,null,3.2,3),{group:'cenoura',units:{un:120},img:'Carrots'}),
 f('beterraba','Beterraba',T,'Beterraba, crua',n(49,1.9,11.1,0.1,null,3.4,10),{group:'beterraba',units:{un:130},img:'Beetroot'}),
 f('tomate','Tomate',T,'Tomate, com semente, cru',n(15,1.1,3.1,0.2,null,1.2,1),{group:'tomate',units:{un:100},img:'Tomato'}),
 f('cebola','Cebola',T,'Cebola, crua',n(39,1.7,8.9,0.1,null,2.2,1),{group:'cebola',units:{un:100},img:'Onion'}),
 f('alho','Alho',T,'Alho, cru',n(113,7.0,23.9,0.2,null,4.3,5),{group:'alho',units:{dente:4},img:'Garlic'}),
 f('alface','Alface',T,'Alface, crespa, crua',n(11,1.3,1.7,0.2,null,1.8,3),{group:'alface',units:{xic:50},img:'Lettuce'}),
 f('brocolis','Brócolis cozido',T,'Brócolis, cozido',n(25,2.1,4.4,0.5,null,3.4,2),{group:'brocolis',units:{xic:90},img:'Broccoli'}),
 f('couve','Couve',T,'Couve, manteiga, crua',n(27,2.9,4.3,0.5,null,3.1,6),{group:'couve',units:{xic:40},img:'Kale'}),
 f('espinafre','Espinafre',T,'Espinafre, Nova Zelândia, cru',n(16,2.0,2.6,0.2,null,2.1,17),{group:'espinafre',units:{xic:30},img:'Spinach'}),
 f('pepino','Pepino',T,'Pepino, cru',n(10,0.9,2.0,0,null,1.1,0),{group:'pepino',units:{un:120},img:'Cucumber'}),
 f('pimentao','Pimentão',T,'Pimentão, verde, cru',n(21,1.1,4.9,0.2,null,2.6,0),{group:'pimentao',units:{un:120},img:'Green Pepper'}),
 f('abobrinha','Abobrinha',T,'Abobrinha, italiana, crua',n(19,1.1,4.3,0.1,null,1.4,0),{group:'abobrinha',units:{un:200},img:'Courgettes'}),
 f('repolho','Repolho',T,'Repolho, branco, cru',n(17,0.9,3.9,0.1,null,1.9,4),{group:'repolho',units:{xic:70},img:'Cabbage'}),
 f('vagem','Vagem',T,'Vagem, crua',n(25,1.8,5.3,0.2,null,2.4,0),{group:'vagem',units:{xic:100},img:'Green Beans'}),
 f('cogumelo','Cogumelo champignon',U,'Mushrooms, white, raw',n(22,3.1,3.3,0.3,0.1,1.0,5),{group:'cogumelos',img:'Mushrooms'}),
 f('quiabo','Quiabo',T,'Quiabo, cru',n(30,1.9,6.4,0.3,null,4.5,0),{group:'quiabo'}),
 f('chuchu','Chuchu',T,'Chuchu, cru',n(17,0.7,4.1,0.1,null,1.3,0),{group:'chuchu',units:{un:250}}),
 f('palmito','Palmito em conserva',U,'Hearts of palm, canned',n(28,2.5,4.6,0.6,0.1,2.4,426),{group:'palmito'}),
 f('azeitona','Azeitona verde',T,'Azeitona, verde, conserva',n(137,0.9,4.1,14.2,null,3.8,1347),{group:'azeitona',units:{un:4},img:'Green Olives'}),
 // Frutas
 f('banana','Banana-prata',T,'Banana, prata, crua',n(98,1.3,26.0,0.1,null,2.0,0),{group:'banana',units:{un:70},img:'Banana',swap:'fruta'}),
 f('maca','Maçã',T,'Maçã, Fuji, com casca, crua',n(56,0.3,15.2,0,null,1.3,0),{group:'maca',units:{un:130},img:'Apple',swap:'fruta'}),
 f('mamao','Mamão papaia',T,'Mamão, Papaia, cru',n(40,0.5,10.4,0.1,null,1.0,2),{group:'mamao',units:{fatia:100},img:'Papaya',swap:'fruta'}),
 f('manga','Manga',T,'Manga, Palmer, crua',n(72,0.4,19.4,0.2,null,1.6,2),{group:'manga',units:{un:250},img:'Mango',swap:'fruta'}),
 f('morango','Morango',T,'Morango, cru',n(30,0.9,6.8,0.3,null,1.7,0),{group:'morango',units:{un:12},img:'Strawberries',swap:'fruta'}),
 f('laranja','Laranja',T,'Laranja, pera, crua',n(37,1.0,8.9,0.1,null,0.8,0),{group:'laranja',units:{un:140},img:'Orange',swap:'fruta'}),
 f('abacate','Abacate',T,'Abacate, cru',n(96,1.2,6.0,8.4,null,6.3,0),{group:'abacate',img:'Avocado'}),
 f('melancia','Melancia',T,'Melancia, crua',n(33,0.9,8.1,0,null,0.1,0),{group:'melancia',units:{fatia:200},swap:'fruta'}),
 f('abacaxi','Abacaxi',T,'Abacaxi, cru',n(48,0.9,12.3,0.1,null,1.0,0),{group:'abacaxi',units:{fatia:75},img:'Pineapple',swap:'fruta'}),
 f('acai','Polpa de açaí sem açúcar',T,'Açaí, polpa, congelada',n(58,0.8,6.2,3.9,null,2.6,5),{group:'acai'}),
 f('limao','Limão',T,'Limão, tahiti, cru',n(32,0.9,11.1,0.1,null,1.2,1),{group:'limao',units:{un:60,cs:15},img:'Lemon'}),
 f('goiaba','Goiaba',T,'Goiaba, vermelha, com casca, crua',n(54,1.1,13.0,0.4,null,6.2,0),{group:'goiaba',units:{un:170},swap:'fruta'}),
 f('coco_ralado','Coco ralado',T,'Coco, cru',n(406,3.7,10.4,42.0,null,5.4,15),{group:'coco',units:{cs:7}}),
 // Carnes, peixes e ovos (crus: o cálculo usa o peso cru, como se compra e pesa)
 f('frango','Peito de frango',T,'Frango, peito, sem pele, cru',n(119,21.5,0,3.0,null,0,56),{group:'frango',units:{file:120},cf:0.75,flags:['carne'],img:'Chicken Breast',swap:'proteina'}),
 f('frango_coxa','Coxa/sobrecoxa de frango sem pele',T,'Frango, coxa, sem pele, crua',n(120,17.8,0,4.9,null,0,98),{group:'frango',units:{un:100},cf:0.75,flags:['carne'],img:'Chicken Thighs',swap:'proteina'}),
 f('patinho','Carne bovina (patinho)',T,'Carne, bovina, patinho, sem gordura, cru',n(133,21.7,0,4.5,null,0,49),{group:'carne',units:{file:120},cf:0.7,flags:['carne'],img:'Beef',swap:'proteina'}),
 f('carne_moida','Carne moída (patinho)',T,'Carne, bovina, patinho, sem gordura, cru',n(133,21.7,0,4.5,null,0,49),{group:'carne',cf:0.7,flags:['carne'],img:'Minced Beef',swap:'proteina'}),
 f('lombo','Lombo suíno',T,'Porco, lombo, cru',n(176,22.6,0,8.8,null,0,53),{group:'porco',cf:0.7,flags:['carne'],img:'Pork',swap:'proteina'}),
 f('tilapia','Filé de peixe (tilápia)',U,'Fish, tilapia, raw',n(96,20.1,0,1.7,0.6,0,52),{group:'peixe',units:{file:120},cf:0.8,flags:['peixe'],img:'White Fish',swap:'proteina'}),
 f('salmao','Salmão',T,'Salmão, sem pele, fresco, cru',n(170,19.3,0,9.7,null,0,64),{group:'salmao',units:{file:150},cf:0.8,flags:['peixe'],img:'Salmon',swap:'proteina'}),
 f('atum','Atum em água (drenado)',U,'Fish, tuna, light, canned in water, drained solids',n(116,25.5,0,0.8,0.2,0,338),{group:'atum',units:{un:120},flags:['peixe'],img:'Tuna',swap:'proteina'}),
 f('sardinha','Sardinha em óleo (drenada)',T,'Sardinha, conserva em óleo',n(285,15.9,0,24.0,null,0,666),{group:'sardinha',units:{un:84},flags:['peixe'],img:'Sardines'}),
 f('camarao','Camarão',U,'Crustaceans, shrimp, raw',n(85,20.1,0,0.5,0.1,0,119),{group:'camarao',cf:0.85,flags:['frutos_do_mar'],img:'Prawns'}),
 f('ovo','Ovo',T,'Ovo, de galinha, inteiro, cru',n(143,13.0,1.6,8.9,null,0,168),{group:'ovo',units:{un:50},flags:['ovo'],img:'Eggs',swap:'proteina'}),
 f('clara','Clara de ovo',U,'Egg, white, raw, fresh',n(52,10.9,0.7,0.2,0,0,166),{group:'ovo',units:{un:33},flags:['ovo'],img:'Egg White'}),
 f('presunto','Presunto magro',T,'Presunto, sem capa de gordura',n(94,14.3,2.1,2.7,null,0,1021),{group:'presunto',units:{fatia:15},flags:['carne'],img:'Ham'}),
 // Laticínios
 f('leite','Leite integral',T,'Leite, de vaca, integral',n(61,2.9,4.3,3.2,null,0,64),{group:'leite',density:1.03,flags:['lactose','leite'],img:'Milk',swap:'leite'}),
 f('leite_desnatado','Leite desnatado',T,'Leite, de vaca, desnatado, UHT',n(35,3.4,4.9,0.2,null,0,51),{group:'leite',density:1.03,flags:['lactose','leite'],img:'Milk',swap:'leite'}),
 f('leite_zero_lactose','Leite integral sem lactose','derivado','Mesmos valores de "Leite, de vaca, integral" (TACO); só a lactose é hidrolisada',n(61,2.9,4.3,3.2,null,0,64),{group:'leite',density:1.03,flags:['leite'],img:'Milk',swap:'leite'}),
 f('iogurte','Iogurte natural',T,'Iogurte, natural',n(51,4.1,1.9,3.0,null,0,52),{group:'iogurte',units:{un:170,cs:20},flags:['lactose','leite'],img:'Greek Yogurt'}),
 f('queijo_minas','Queijo minas frescal',T,'Queijo, minas, frescal',n(264,17.4,3.2,20.2,null,0,31),{group:'queijo',units:{fatia:30},flags:['lactose','leite'],img:'Cheese',swap:'queijo'}),
 f('mucarela','Muçarela',T,'Queijo, mozarela',n(330,22.6,3.0,25.2,null,0,581),{group:'queijo',units:{fatia:15},flags:['lactose','leite'],img:'Mozzarella',swap:'queijo'}),
 f('ricota','Ricota',T,'Queijo, ricota',n(140,12.6,3.8,8.1,null,0,283),{group:'queijo',units:{cs:25},flags:['lactose','leite'],img:'Ricotta',swap:'queijo'}),
 f('requeijao','Requeijão cremoso',T,'Queijo, requeijão, cremoso',n(257,9.6,2.4,23.4,null,0,558),{group:'queijo',units:{cs:30},flags:['lactose','leite'],img:'Cream Cheese'}),
 f('parmesao','Queijo parmesão',T,'Queijo, parmesão',n(453,35.6,1.7,33.5,null,0,1844),{group:'queijo',units:{cs:10},flags:['lactose','leite'],img:'Parmesan'}),
 f('manteiga','Manteiga',T,'Manteiga, com sal',n(726,0.4,0.1,82.4,null,0,579),{group:'manteiga',units:{cc:5,cs:13},flags:['lactose','leite'],img:'Butter'}),
 // Gorduras, oleaginosas e outros
 f('azeite','Azeite de oliva',T,'Azeite, de oliva, extra virgem',n(884,0,0,100,null,0,0),{group:'azeite',density:0.92,flags:[],img:'Olive Oil',staple:true}),
 f('oleo','Óleo de soja',T,'Óleo, de soja',n(884,0,0,100,null,0,0),{group:'oleo',density:0.92,img:'Vegetable Oil',staple:true}),
 f('leite_coco','Leite de coco',T,'Leite, de coco',n(166,1.0,2.2,18.4,null,0.7,44),{group:'coco',density:1.0,img:'Coconut Milk'}),
 f('mel','Mel',T,'Mel, de abelha',n(309,0,84.0,0,null,0,6),{group:'mel',units:{cs:21,cc:7},img:'Honey'}),
 f('cacau','Cacau em pó 100%',U,'Cocoa, dry powder, unsweetened',n(228,19.6,57.9,13.7,8.1,37.0,21),{group:'cacau',units:{cs:6},img:'Cocoa'}),
 f('chocolate70','Chocolate 70% cacau',U,'Chocolate, dark, 70-85% cacao solids',n(598,7.8,45.9,42.6,24.5,10.9,20),{group:'chocolate',units:{un:5},flags:['leite'],img:'Dark Chocolate'}),
 f('pasta_amendoim','Pasta de amendoim integral',U,'Peanut butter, smooth style, with salt',n(588,25.1,20.0,50.4,10.3,6.0,459),{group:'amendoim',units:{cs:15},flags:['amendoim'],img:'Peanut Butter'}),
 f('amendoim','Amendoim',T,'Amendoim, grão, cru',n(544,27.2,20.3,43.9,null,8.0,0),{group:'amendoim',units:{cs:10},flags:['amendoim'],img:'Peanuts'}),
 f('castanha_para','Castanha-do-pará',T,'Castanha-do-Brasil, crua',n(643,14.5,15.1,63.5,null,7.9,1),{group:'castanha',units:{un:4},flags:['castanhas']}),
 f('castanha_caju','Castanha-de-caju',T,'Castanha-de-caju, torrada, salgada',n(570,18.5,29.1,46.3,null,3.7,125),{group:'castanha',units:{un:2,cs:10},flags:['castanhas'],img:'Cashew Nuts'}),
 f('chia','Chia',U,'Seeds, chia seeds, dried',n(486,16.5,42.1,30.7,3.3,34.4,16),{group:'chia',units:{cs:12}}),
 f('linhaca','Linhaça',T,'Linhaça, semente',n(495,14.1,43.3,32.3,null,33.5,9),{group:'linhaca',units:{cs:10}}),
 f('shoyu','Shoyu',U,'Soy sauce made from soy and wheat (shoyu)',n(53,8.1,4.9,0.6,0.1,0.8,5493),{group:'shoyu',units:{cs:16,cc:5},flags:['soja','gluten'],img:'Soy Sauce'}),
 f('fermento','Fermento químico',U,'Leavening agents, baking powder, double-acting',n(53,0,27.7,0,0,0.2,10600),{group:'fermento',units:{cc:4,cs:12},img:'Baking Powder'}),
 f('sal','Sal',T,'Sal, refinado (sódio)',n(0,0,0,0,0,0,39263),{group:'sal',units:{cc:5},img:'Salt',staple:true}),
 f('agua','Água',T,'Água',n(0,0,0,0,0,0,0),{group:'agua',density:1,staple:true}),
 // Temperos usados "a gosto": entram na receita, mas não no cálculo (quantidade indefinida).
 f('temperos','Temperos verdes (cheiro-verde, coentro, cebolinha)','derivado','Usado a gosto: fora do cálculo',n(0,0,0,0,null,null,null),{group:'temperos',img:'Coriander',staple:true}),
 f('especiarias','Especiarias (canela, cominho, colorau, pimenta)','derivado','Usado a gosto: fora do cálculo',n(0,0,0,0,null,null,null),{group:'temperos',img:'Cinnamon',staple:true}),
];

const BY_ID=new Map(FOODS.map(x=>[x.id,x]));
export const getFood=(id:string)=>BY_ID.get(id);

// Grupos de troca: alternativas com papel parecido no prato (trocadas pelo mesmo peso).
export function swapOptions(foodId:string):Food[]{const food=getFood(foodId);if(!food?.swap)return [];return FOODS.filter(x=>x.swap===food.swap&&x.id!==food.id)}

// Palavras que ligam um ingrediente "que tenho em casa" (galeria, foto ou voz) aos grupos do banco.
export const PANTRY_GROUPS:Record<string,string[]>={
 frango:['frango','galinha','peito','coxa','sobrecoxa'],carne:['carne','bife','patinho','alcatra','acem','carne moida','musculo'],porco:['porco','lombo','bisteca'],
 peixe:['peixe','tilapia','merluza','pescada'],salmao:['salmao'],atum:['atum'],sardinha:['sardinha'],camarao:['camarao'],ovo:['ovo','ovos','clara'],
 presunto:['presunto'],tofu:['tofu'],arroz:['arroz'],feijao:['feijao','fradinho','feijao verde'],lentilha:['lentilha'],'grao-de-bico':['grao-de-bico','grao de bico'],
 ervilha:['ervilha'],aveia:['aveia'],cuscuz:['cuscuz','flocao','fuba','farinha de milho'],tapioca:['tapioca','goma'],pao:['pao'],macarrao:['macarrao','massa','espaguete'],
 farinha:['farinha'],quinoa:['quinoa'],milho:['milho','pipoca'],batata:['batata','batata inglesa'],'batata-doce':['batata-doce','batata doce'],mandioca:['mandioca','macaxeira','aipim'],
 inhame:['inhame','cara'],abobora:['abobora','jerimum'],cenoura:['cenoura'],beterraba:['beterraba'],tomate:['tomate'],cebola:['cebola'],alho:['alho'],alface:['alface','folhas','salada verde'],
 brocolis:['brocolis'],couve:['couve'],espinafre:['espinafre'],pepino:['pepino'],pimentao:['pimentao'],abobrinha:['abobrinha'],repolho:['repolho'],vagem:['vagem'],
 cogumelos:['cogumelo','champignon'],quiabo:['quiabo'],chuchu:['chuchu'],palmito:['palmito'],azeitona:['azeitona'],banana:['banana'],maca:['maca'],mamao:['mamao'],manga:['manga'],
 morango:['morango'],laranja:['laranja'],abacate:['abacate'],melancia:['melancia'],abacaxi:['abacaxi'],acai:['acai'],limao:['limao'],goiaba:['goiaba'],coco:['coco','leite de coco'],
 leite:['leite'],iogurte:['iogurte'],queijo:['queijo','mucarela','mussarela','ricota','requeijao','parmesao'],manteiga:['manteiga'],mel:['mel'],cacau:['cacau'],chocolate:['chocolate'],
 amendoim:['amendoim'],castanha:['castanha'],chia:['chia'],linhaca:['linhaca'],shoyu:['shoyu'],
};
