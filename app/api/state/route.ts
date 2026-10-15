import {NextResponse} from 'next/server';
import {db,hasDb} from '@/lib/db';
import {statePatchSchema} from '@/lib/types';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const KEYS=['profiles','saved','plan','shopping'];
// Sem DATABASE_URL o app segue funcionando só com os dados do aparelho.
const noDb=()=>NextResponse.json({error:'Banco não configurado.',code:'no_db'},{status:503});
const fail=(e:unknown)=>NextResponse.json({error:e instanceof Error?e.message:'Erro no banco de dados.'},{status:500});
export async function GET(){
 if(!hasDb())return noDb();
 try{const sql=await db();const rows=await sql`select key,value from app_state where key = any(${KEYS})`;return NextResponse.json(Object.fromEntries(rows.map(r=>[r.key,r.value])))}catch(e){return fail(e)}
}
// Grava só as chaves enviadas, para um aparelho não sobrescrever o que o outro mudou em outra seção.
export async function PUT(req:Request){
 if(!hasDb())return noDb();
 if(Number(req.headers.get('content-length')||0)>1_500_000)return NextResponse.json({error:'Dados grandes demais.'},{status:413});
 const parsed=statePatchSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Dados inválidos.'},{status:400});
 try{const sql=await db();
  for(const [key,value] of Object.entries(parsed.data)){if(value===undefined)continue;await sql`insert into app_state(key,value) values(${key},${JSON.stringify(value)}::jsonb) on conflict(key) do update set value=excluded.value,updated_at=now()`}
  return NextResponse.json({ok:true});
 }catch(e){return fail(e)}
}
// "Apagar tudo" na tela de privacidade.
export async function DELETE(){
 if(!hasDb())return noDb();
 try{const sql=await db();await sql`delete from app_state`;return NextResponse.json({ok:true})}catch(e){return fail(e)}
}
