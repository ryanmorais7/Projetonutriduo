import {test} from 'node:test';
import assert from 'node:assert/strict';
import {migrateV2,normalizeDiet} from '../lib/normalize';
import {compatibility,flagsFromText,restrictionFlags} from '../lib/restrictions';
import {coupleView,personKey} from '../lib/stateKeys';
import {mealNow} from '../lib/time';

const entry=(title:string,forWho:string)=>({recipe:{title,description:'',minutes:10,difficulty:'facil',image:null,mode:'casa',forWho,ingredients:[],steps:[],substitutions:[],portions:{},adaptations:{},highlights:[],nutrition:'',cautions:[],askRestaurant:[]},forWho,done:false});

test('isolamento: migração separa o plano por pessoa', ()=>{
 const v2={profiles:{pessoa1:{name:'Ryan'},pessoa2:{name:'Chrysalis',allergies:['Camarão']}},plan:{'seg-almoco':entry('Do Ryan','pessoa1'),'ter-almoco':entry('Da Chrysalis','pessoa2'),'qua-jantar':entry('Do casal','ambos')}};
 const {persons}=migrateV2(v2);
 assert.deepEqual(Object.keys(persons.pessoa1.plan!).sort(),['qua-jantar','seg-almoco']);
 assert.deepEqual(Object.keys(persons.pessoa2.plan!).sort(),['qua-jantar','ter-almoco']);
 assert.deepEqual(persons.pessoa1.diet!.allergies,[],'alergia da Chrysalis não vaza para o Ryan');
 assert.deepEqual(persons.pessoa2.diet!.allergies,['Camarão']);
});

test('isolamento: chaves separadas e modo casal só vê preferências alimentares', ()=>{
 assert.notEqual(personKey('pessoa1','plan'),personKey('pessoa2','plan'));
 const view=coupleView({likes:['Frango'],allergies:['Amendoim'],body:{weight:'60',height:'160',age:'30',activity:''},useBody:true,notes:'privado',routine:{wake:'06:00',sleep:'22:00'},hidden:['x']},'pessoa2');
 assert.deepEqual(view.likes,['Frango']);assert.deepEqual(view.allergies,['Amendoim']);
 for(const k of ['body','notes','routine','useBody','hidden','onboarded'])assert.ok(!(k in view),`${k} não pode ir para o outro perfil`);
});

test('privacidade: observações de saúde antigas são removidas, o resto é preservado', ()=>{
 const removed:string[]=[];
 const d=normalizeDiet({name:'Meu amor',avoids:['Lactose','Glúten'],notes:'Intestino sensível. Evitar alimentos que provoquem sintomas.'},'pessoa2',removed);
 assert.equal(d.notes,'');assert.deepEqual(d.avoids,[]);assert.equal(removed.length,2);
 const kept=normalizeDiet({avoids:['Lactose','Glúten','Coentro'],intolerances:[],notes:'Gosto de pimenta'},'pessoa2',[]);
 assert.equal(kept.notes,'Gosto de pimenta');assert.equal(kept.avoids.length,3);
});

test('restrições: intolerância, alergia, celíaca e vegetariana viram marcações diferentes', ()=>{
 assert.deepEqual(flagsFromText(['Lactose']),['lactose']);
 assert.deepEqual(flagsFromText(['Leite']).sort(),['lactose','leite']);
 assert.deepEqual(restrictionFlags({intolerances:[],allergies:[],celiac:true,vegetarian:false}),['gluten']);
 assert.deepEqual(restrictionFlags({intolerances:[],allergies:['frutos do mar'],celiac:false,vegetarian:true}).sort(),['carne','frutos_do_mar','peixe']);
 const c=compatibility({flags:['lactose','leite'],ingredients:[{name:'Cebola'}]},[{name:'A',diet:{intolerances:['lactose'],allergies:[],celiac:false,vegetarian:false,avoids:['cebola']}}]);
 assert.equal(c.ok,false);assert.equal(c.issues.length,2);
});

test('refeição do momento pelo horário local e pela rotina', ()=>{
 const at=(h:number,m=0)=>new Date(2026,9,15,h,m);
 assert.equal(mealNow({wake:'07:00',sleep:'23:00'},at(8)),'cafe');
 assert.equal(mealNow({wake:'07:00',sleep:'23:00'},at(12,30)),'almoco');
 assert.equal(mealNow({wake:'07:00',sleep:'23:00'},at(16)),'lanche');
 assert.equal(mealNow({wake:'07:00',sleep:'23:00'},at(20)),'jantar');
 assert.equal(mealNow({wake:'09:30',sleep:'01:00'},at(11)),'cafe','quem acorda tarde ainda está no café às 11h');
});
