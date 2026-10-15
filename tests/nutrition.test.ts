import {test} from 'node:test';
import assert from 'node:assert/strict';
import {computeNutrition,formatQty,parseSpec,scaleNutrients,toGrams} from '../lib/nutrition/calc';
import {FOODS,getFood} from '../lib/nutrition/foods';

test('conversão de medidas caseiras em gramas', ()=>{
 assert.equal(toGrams(getFood('ovo')!,2,'un'),100);
 assert.equal(toGrams(getFood('frango')!,150,'g'),150);
 assert.equal(toGrams(getFood('leite')!,200,'ml'),206); // densidade 1,03
 assert.ok(Math.abs(toGrams(getFood('azeite')!,1,'cs')!-13.8)<0.01); // 15 ml × 0,92
 assert.equal(toGrams(getFood('aveia')!,2,'cs'),30);
 assert.equal(toGrams(getFood('sal')!,0,'agosto'),null);
 assert.equal(toGrams(getFood('goma')!,1,'xic'),null,'medida sem fator documentado não é inventada');
});

test('calorias e macronutrientes somados por ingrediente e divididos pelo rendimento', ()=>{
 const r=computeNutrition([parseSpec('arroz 100g'),parseSpec('frango 100g~')],2);
 assert.equal(r.status,'completo');
 assert.equal(r.total!.kcal,247); // 128 + 119
 assert.equal(r.perServing!.kcal,124); // 123,5 arredondado
 assert.equal(r.perServing!.protein,12); // (2,5 + 21,5) / 2
 assert.equal(r.perServing!.carbs,14.1);
 assert.equal(r.portionGrams,88); // (100 + 100 × 0,75 de rendimento) / 2
});

test('mudança de porções escala todos os nutrientes', ()=>{
 const r=computeNutrition([parseSpec('ovo 2un'),parseSpec('pao_frances 1un')],1);
 const x=scaleNutrients(r.perServing!,1.5);
 assert.equal(Math.round(x.kcal),Math.round(r.perServing!.kcal*1.5));
 assert.equal(Math.round(x.protein*10)/10,Math.round(r.perServing!.protein*1.5*10)/10);
 assert.ok(x.sodium!==null&&x.sodium>r.perServing!.sodium!);
});

test('ausência de dados: estimativa indisponível em vez de número inventado', ()=>{
 const r=computeNutrition([parseSpec('ovo 2un'),{food:'goma',amount:1,unit:'xic',cooked:false}],1);
 assert.equal(r.status,'indisponivel');
 assert.equal(r.perServing,null);
 assert.deepEqual(r.missing,['Goma de tapioca hidratada']);
 const sat=computeNutrition([parseSpec('frango 100g')],1);
 assert.equal(sat.perServing!.sat,null,'gordura saturada sem dado fica null, não zero');
});

test('temperos a gosto ficam fora do cálculo', ()=>{
 const a=computeNutrition([parseSpec('ovo 1un')],1),b=computeNutrition([parseSpec('ovo 1un'),parseSpec('sal agosto'),parseSpec('temperos agosto')],1);
 assert.deepEqual(a.perServing,b.perServing);
});

test('notação de ingredientes e formatação', ()=>{
 assert.deepEqual(parseSpec('frango 300g~:Peito em cubos'),{food:'frango',amount:300,unit:'g',cooked:true,label:'Peito em cubos'});
 assert.throws(()=>parseSpec('unicornio 1un'),/desconhecido/);
 assert.throws(()=>parseSpec('ovo un'),/Quantidade/);
 assert.equal(formatQty(0.5,'un'),'½ unidade');
 assert.equal(formatQty(2,'cs'),'2 colheres de sopa');
 assert.equal(formatQty(123,'g'),'125 g');
});

test('banco de alimentos: valores coerentes (Atwater ±25%) e fonte declarada', ()=>{
 // Divergências conhecidas e explicadas (as tabelas usam fatores de energia específicos por alimento):
 // limão (ácidos orgânicos no carboidrato por diferença), fermento (minerais), cacau/chia/linhaça/pipoca (muita fibra).
 const KNOWN=new Set(['limao','fermento','cacau','chia','linhaca','pipoca']);
 const off:string[]=[];
 for(const f of FOODS){
  assert.ok(f.ref.length>3,`${f.id} sem referência`);
  const p=f.per100;if(p.kcal===0||KNOWN.has(f.id))continue;
  const est=p.protein*4+p.carbs*4+p.fat*9;
  // Hortaliças fibrosas e pouco calóricas: a regra 4/4/9 superestima; tolerância absoluta.
  if(!(Math.abs(est-p.kcal)/p.kcal<0.25||(p.kcal<40&&Math.abs(est-p.kcal)<8)))off.push(`${f.id}: ${p.kcal} kcal vs ${est.toFixed(0)}`);
 }
 assert.deepEqual(off,[]);
});
