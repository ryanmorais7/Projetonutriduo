import {NextResponse} from 'next/server';
import {db,hasDb} from './db';

// Controle de custo das rotas de IA: limite por IP por minuto (memória da instância)
// e teto diário global (no Neon quando existe; senão, por instância).
const PER_MINUTE=Number(process.env.AI_PER_MINUTE||8);
const DAILY=Number(process.env.AI_DAILY_LIMIT||150);
const hits=new Map<string,number[]>();
let memDay='',memCount=0;

const tooMany=(error:string)=>NextResponse.json({error,code:'rate_limited'},{status:429});

export async function guardAI(req:Request,cost=1):Promise<NextResponse|null>{
 const ip=(req.headers.get('x-forwarded-for')||'').split(',')[0].trim()||'local';
 const now=Date.now();
 if(hits.size>2000)hits.clear();
 const recent=(hits.get(ip)||[]).filter(t=>now-t<60_000);
 if(recent.length>=PER_MINUTE)return tooMany('Muitos pedidos seguidos. Espere um minutinho e tente de novo.');
 recent.push(now);hits.set(ip,recent);
 const day=new Date().toISOString().slice(0,10);
 if(hasDb()){
  try{const sql=await db();const rows=await sql`insert into ai_usage(day,count) values(${day},${cost}) on conflict(day) do update set count=ai_usage.count+${cost} returning count`;
   if(Number(rows[0]?.count)>DAILY)return tooMany('O limite diário de uso da IA foi atingido. Amanhã libera de novo.');
   return null;
  }catch{/* banco indisponível: cai no contador em memória */}
 }
 if(memDay!==day){memDay=day;memCount=0}
 memCount+=cost;
 return memCount>DAILY?tooMany('O limite diário de uso da IA foi atingido. Amanhã libera de novo.'):null;
}
