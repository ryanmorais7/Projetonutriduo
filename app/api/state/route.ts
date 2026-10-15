import {NextResponse} from 'next/server';
import {db,hasDb} from '@/lib/db';
import {coupleView,personKey,PUBLIC_KEY} from '@/lib/stateKeys';
import {PEOPLE,PERSON_KEYS,statePutSchema,type PersonId} from '@/lib/types';
export const runtime='nodejs';
export const dynamic='force-dynamic';

// Nuvem só com acesso privado: se há banco mas não há APP_PASSWORD, o app fica só no aparelho.
function unavailable(){
 if(!hasDb())return NextResponse.json({error:'Banco não configurado.',code:'no_db'},{status:503});
 if(!process.env.APP_PASSWORD)return NextResponse.json({error:'Sincronização desligada: configure APP_PASSWORD para proteger os dados na nuvem.',code:'no_private_access'},{status:503});
 return null;
}
const fail=(e:unknown)=>NextResponse.json({error:e instanceof Error?e.message:'Erro no banco de dados.'},{status:500});
const person=(v:string|null):PersonId|null=>PEOPLE.includes(v as PersonId)?v as PersonId:null;

// GET ?person=pessoa1 → só os dados dessa pessoa + perfis públicos.
// GET ?person=pessoa2&scope=couple → só as preferências alimentares (modo casal).
export async function GET(req:Request){
 const off=unavailable();if(off)return off;
 const url=new URL(req.url),id=person(url.searchParams.get('person'));
 if(!id)return NextResponse.json({error:'Perfil inválido.'},{status:400});
 try{
  const sql=await db();
  if(url.searchParams.get('scope')==='couple'){
   const rows=await sql`select value from app_state where key=${personKey(id,'diet')}`;
   return NextResponse.json({diet:rows[0]?coupleView(rows[0].value,id):null});
  }
  const keys=[PUBLIC_KEY,...PERSON_KEYS.map(k=>personKey(id,k))];
  const rows=await sql`select key,value from app_state where key = any(${keys})`;
  const out:Record<string,unknown>={};
  for(const r of rows)out[r.key===PUBLIC_KEY?'public':String(r.key).split(':')[1]]=r.value;
  return NextResponse.json(out);
 }catch(e){return fail(e)}
}

// PUT {person, patch, public} → grava cada chave da pessoa separadamente.
export async function PUT(req:Request){
 const off=unavailable();if(off)return off;
 if(Number(req.headers.get('content-length')||0)>1_500_000)return NextResponse.json({error:'Dados grandes demais.'},{status:413});
 const parsed=statePutSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Dados inválidos.'},{status:400});
 const {person:id,patch,public:pub}=parsed.data;
 try{
  const sql=await db();
  const write=(key:string,value:unknown)=>sql`insert into app_state(key,value) values(${key},${JSON.stringify(value)}::jsonb) on conflict(key) do update set value=excluded.value,updated_at=now()`;
  if(pub)await write(PUBLIC_KEY,pub);
  for(const [k,v] of Object.entries(patch||{}))if(v!==undefined)await write(personKey(id,k as never),v);
  return NextResponse.json({ok:true});
 }catch(e){return fail(e)}
}

// DELETE ?person=pessoa1 → apaga só os dados dessa pessoa.
export async function DELETE(req:Request){
 const off=unavailable();if(off)return off;
 const id=person(new URL(req.url).searchParams.get('person'));
 if(!id)return NextResponse.json({error:'Perfil inválido.'},{status:400});
 try{const sql=await db();await sql`delete from app_state where key = any(${PERSON_KEYS.map(k=>personKey(id,k))})`;return NextResponse.json({ok:true})}catch(e){return fail(e)}
}
