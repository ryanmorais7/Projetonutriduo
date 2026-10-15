import {neon} from '@neondatabase/serverless';
let ready:Promise<unknown>|null=null;
export const hasDb=()=>!!process.env.DATABASE_URL;
// Cria as tabelas na primeira chamada de cada instância; chave/valor em JSON espelha o estado do app.
// Também apaga a chave "symptoms" da versão antiga, que guardava um dado de saúde pessoal.
export async function db(){
 const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL não configurada.');
 const sql=neon(url);
 ready??=(async()=>{
  await sql`create table if not exists app_state(key text primary key,value jsonb not null,updated_at timestamptz not null default now())`;
  await sql`create table if not exists ai_usage(day date primary key,count integer not null default 0)`;
  await sql`delete from app_state where key='symptoms'`;
 })().catch(e=>{ready=null;throw e});
 await ready;return sql;
}
