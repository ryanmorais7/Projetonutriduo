import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GROUND,poseAt,solve} from '../lib/exercises/figure';
import {EXERCISES} from '../lib/exercises/library';
import {allowedExercises,blockReason,buildSession,generateWeek} from '../lib/exercises/session';
import {DEFAULT_EXERCISE} from '../lib/normalize';
import type {ExerciseProfile} from '../lib/types';

const P=(o:Partial<ExerciseProfile>):ExerciseProfile=>({...DEFAULT_EXERCISE,...o});
const total=(s:{steps:{seconds:number}[]})=>s.steps.reduce((a,x)=>a+x.seconds,0);

test('sem respostas ou sem liberação (recuperação): nenhum treino é montado', ()=>{
 assert.equal(allowedExercises(P({})).length,0);
 assert.equal(allowedExercises(P({clearance:'recuperacao'})).length,0);
 assert.ok('error' in buildSession('corpo',20,P({clearance:'recuperacao'})));
});

test('sem certeza da liberação: só exercícios leves, sem pranchas e flexões', ()=>{
 const ok=allowedExercises(P({clearance:'nao_sei'}));
 assert.ok(ok.length>=10);
 assert.ok(ok.every(e=>e.level==='leve'&&!e.needsClearance));
 assert.ok(!ok.some(e=>e.id==='prancha'||e.id==='flexao-joelhos'||e.id==='polichinelo'));
});

test('limitações excluem a região marcada', ()=>{
 const ok=allowedExercises(P({clearance:'liberado',limits:['joelho']}));
 assert.ok(!ok.some(e=>e.loads.includes('joelho')));
 assert.ok(!ok.some(e=>e.id==='agachamento'||e.id==='afundo'));
 assert.match(blockReason(EXERCISES.find(e=>e.id==='agachamento')!,P({clearance:'liberado',limits:['joelho']}))!,/joelho/i);
 const abd=allowedExercises(P({clearance:'liberado',limits:['abdomen']}));
 assert.ok(!abd.some(e=>e.category==='core'&&e.loads.includes('abdomen')));
});

test('esteira e bicicleta: sessões adaptáveis ao tempo escolhido', ()=>{
 const p=P({clearance:'liberado',equipment:['esteira','bicicleta'],level:'intermediario'});
 for(const m of [10,15,20,30,45])for(const f of ['esteira','bicicleta'] as const){
  const s=buildSession(f,m,p);assert.ok(!('error' in s));
  if(!('error' in s))assert.equal(total(s),m*60,`${f} ${m} min`);
 }
 const beginner=buildSession('bicicleta',30,P({clearance:'nao_sei',equipment:['bicicleta']}));
 assert.ok(!('error' in beginner)&&beginner.steps.every(s=>s.exerciseId==='bike-leve'),'sem liberação: só pedal leve');
 assert.ok('error' in buildSession('esteira',20,P({clearance:'liberado'})),'sem esteira marcada: não monta');
});

test('treinos com peso do corpo cabem no tempo e têm descanso', ()=>{
 const p=P({clearance:'liberado'});
 for(const m of [10,15,20,30,45]){
  const s=buildSession('corpo',m,p);assert.ok(!('error' in s));
  if(!('error' in s)){assert.ok(total(s)<=m*60&&total(s)>=m*60-90,`${m} min → ${total(s)} s`);assert.ok(s.steps.some(x=>x.kind==='descanso'))}
 }
});

test('semana de treinos com descanso no domingo e progressão gradual', ()=>{
 const w=generateWeek(P({clearance:'liberado',days:3}));
 assert.equal(Object.values(w).filter(d=>d.kind==='treino').length,3);
 assert.equal(w.dom.kind,'descanso');
});

test('demonstrações: apoios no lugar certo (pés no chão nas posições em pé)', ()=>{
 for(const e of EXERCISES){
  assert.ok(e.figure.frames.length>=1,e.id);
  for(let k=0;k<1;k+=0.125){
   const s=solve(poseAt(e.figure,k),e.figure.view);
   for(const p of Object.values(s))assert.ok(p.every(Number.isFinite),`${e.id}: ponto inválido`);
   assert.ok(Math.max(s.aN[1],s.aF[1],s.kN[1],s.kF[1],s.wN[1],s.wF[1])<=GROUND+1.5,`${e.id}: atravessa o chão`);
  }
 }
 for(const e of EXERCISES)for(const k of [-0.25,-1e-9,1,7.5])assert.ok(poseAt(e.figure,k).hip,`${e.id}: fase ${k} sem pose`);
 const squat=EXERCISES.find(e=>e.id==='agachamento')!;
 for(const k of [0,0.25,0.5]){const s=solve(poseAt(squat.figure,k),'side');assert.ok(Math.abs(s.aN[1]-GROUND)<1.5&&Math.abs(s.aN[0]-60)<1.5,'pés plantados durante o agachamento')}
});
