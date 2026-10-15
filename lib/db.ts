import {neon} from '@neondatabase/serverless';
import {migrateV2} from './normalize';
import {personKey,PUBLIC_KEY} from './stateKeys';
import {PEOPLE} from './types';
let ready:Promise<unknown>|null=null;
export const hasDb=()=>!!process.env.DATABASE_URL;

// Cria as tabelas na primeira chamada de cada instância e faz migrações únicas:
// - apaga a chave "symptoms" (dado de saúde pessoal da versão 1);
// - converte o formato compartilhado da versão 2 (profiles/saved/plan/shopping) em chaves por pessoa.
export async function db(){
 const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL não configurada.');
 const sql=neon(url);
 ready??=(async()=>{
  await sql`create table if not exists app_state(key text primary key,value jsonb not null,updated_at timestamptz not null default now())`;
  await sql`create table if not exists ai_usage(day date primary key,count integer not null default 0)`;
  await sql`delete from app_state where key='symptoms'`;
  const old=await sql`select key,value from app_state where key in ('profiles','saved','plan','shopping')`;
  if(old.length){
   const {public:pub,persons}=migrateV2(Object.fromEntries(old.map(r=>[r.key,r.value])));
   const write=(key:string,value:unknown)=>sql`insert into app_state(key,value) values(${key},${JSON.stringify(value)}::jsonb) on conflict(key) do nothing`;
   await write(PUBLIC_KEY,pub);
   for(const id of PEOPLE)for(const [k,v] of Object.entries(persons[id]))await write(personKey(id,k as never),v);
   await sql`delete from app_state where key in ('profiles','saved','plan','shopping')`;
  }
 })().catch(e=>{ready=null;throw e});
 await ready;return sql;
}
