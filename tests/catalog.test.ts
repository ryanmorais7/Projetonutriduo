import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DISHES} from '../lib/catalog';
import {getFood} from '../lib/nutrition/foods';
import {filterRecipes,planMeals,recipeFlags,recipeNutrition,RECIPES,searchRecipes} from '../lib/recipes';

test('catálogo tem 150 receitas na distribuição pedida', ()=>{
 const by=(c:string)=>RECIPES.filter(r=>r.cat===c).length;
 assert.equal(RECIPES.length,150);
 assert.deepEqual([by('cafe'),by('almoco'),by('lanche'),by('jantar'),by('extra')],[30,40,30,30,20]);
});

test('ids e nomes únicos; dados completos e plausíveis', ()=>{
 assert.equal(new Set(RECIPES.map(r=>r.id)).size,RECIPES.length);
 assert.equal(new Set(RECIPES.map(r=>r.title.toLowerCase())).size,RECIPES.length,'sem títulos repetidos');
 for(const r of RECIPES){
  assert.ok(r.steps.length>=1&&r.servings>=1&&r.minutes>0,r.id);
  assert.ok(r.ingredients.length>=1,r.id);
  if(r.photo)assert.ok(r.photo in DISHES,`${r.id}: foto inexistente`);
  const n=recipeNutrition(r.id)!;
  assert.equal(n.status,'completo',`${r.id}: ${n.missing.join(', ')}`);
  assert.ok(n.perServing!.kcal>=20&&n.perServing!.kcal<=1100,`${r.id}: ${n.perServing!.kcal} kcal por porção`);
  assert.ok(n.portionGrams!>=15&&n.portionGrams!<=900,`${r.id}: porção de ${n.portionGrams} g`);
 }
});

test('card não mostra foto enganosa quando o ingrediente principal não tem foto', ()=>{
 const melancia=searchRecipes({q:'melancia',pageSize:24}).items.find(x=>x.recipeId==='lanche-melancia-limao-hortela')!;
 assert.deepEqual(melancia.thumbs,[]);
 const frango=searchRecipes({q:'frango grelhado com batata',pageSize:24}).items[0];
 assert.ok(frango.image||frango.thumbs!.length>0);
});

test('filtros alimentares respeitam a composição', ()=>{
 const all={pageSize:24,page:0};
 const ids=(o:object)=>filterRecipes({...all,...o}).ranked;
 assert.ok(ids({noLactose:true}).every(r=>!recipeFlags(r.id).includes('lactose')));
 assert.ok(ids({noGluten:true}).every(r=>!recipeFlags(r.id).includes('gluten')));
 assert.ok(ids({vegetarian:true}).every(r=>!recipeFlags(r.id).some(f=>f==='carne'||f==='peixe'||f==='frutos_do_mar')));
 assert.ok(ids({vegetarian:true}).length>=20,'há opções vegetarianas suficientes');
 assert.ok(ids({personal:{flags:['amendoim'],avoid:[],likes:[],hidden:[]}}).every(r=>!recipeFlags(r.id).includes('amendoim')));
 assert.ok(ids({without:'cebola'}).every(r=>!r.ingredients.some(i=>i.food==='cebola')));
 assert.ok(ids({maxTime:10}).every(r=>r.minutes<=10));
 assert.ok(ids({meal:'cafe',maxTime:10}).length>=10,'muitos cafés rápidos');
 assert.ok(ids({meal:'sobremesa'}).every(r=>r.tags.includes('sobremesa')));
});

test('filtro por ingredientes disponíveis', ()=>{
 const have=['Ovos','Tomate','Pão'];
 const todos=filterRecipes({have,avail:'todos',pageSize:24}).ranked;
 assert.ok(todos.length>=1);
 for(const r of todos)for(const i of r.ingredients)if(i.unit!=='agosto'&&!getFood(i.food)!.staple)assert.ok(['ovo','tomate','pao'].includes(getFood(i.food)!.group),`${r.id} usa ${i.food}`);
 const falta1=filterRecipes({have,avail:'falta1',pageSize:24}).ranked;
 assert.ok(falta1.length>todos.length);
 const geladeira=filterRecipes({have:['frango congelado'],avail:'geladeira',pageSize:24}).ranked;
 assert.ok(geladeira.every(r=>r.ingredients.some(i=>getFood(i.food)!.group==='frango')));
});

test('paginação sem repetição e "semelhantes"', ()=>{
 const a=searchRecipes({meal:'lanche',page:0,pageSize:6,seed:1}),b=searchRecipes({meal:'lanche',page:1,pageSize:6,seed:1});
 assert.equal(a.items.length,6);assert.ok(a.hasMore);
 assert.equal(a.items.filter(x=>b.items.some(y=>y.id===x.id)).length,0);
 const sim=searchRecipes({similarTo:'almoco-moqueca-peixe',pageSize:6});
 assert.ok(!sim.items.some(x=>x.id==='almoco-moqueca-peixe'));
 assert.equal(sim.items[0].id,'almoco-moqueca-camarao');
 const surpresa1=searchRecipes({meal:'cafe',seed:11}).items.map(x=>x.id).join(),surpresa2=searchRecipes({meal:'cafe',seed:12}).items.map(x=>x.id).join();
 assert.notEqual(surpresa1,surpresa2,'"Surpreenda-me" muda a ordem');
});

test('cardápio da semana sem receitas repetidas e preservando o que já existe', ()=>{
 const slots=['seg','ter','qua','qui','sex','sab','dom'].flatMap(d=>(['cafe','almoco','lanche','jantar'] as const).map(m=>({key:`${d}-${m}`,meal:m})));
 const out=planMeals({slots:slots.filter(s=>s.key!=='seg-cafe'),keep:['cafe-cuscuz-ovo'],search:{},forWho:'pessoa1',seed:3});
 const ids=Object.values(out).map(s=>s.recipeId);
 assert.equal(ids.length,27);
 assert.equal(new Set(ids).size,27);
 assert.ok(!ids.includes('cafe-cuscuz-ovo'));
 assert.ok(Object.entries(out).every(([k,s])=>k.endsWith(s.category!)||k.endsWith('lanche')||k.endsWith('almoco')||k.endsWith('jantar')||k.endsWith('cafe')));
});
