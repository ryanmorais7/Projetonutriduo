import {NextResponse} from 'next/server';
import {SESSION_COOKIE,SESSION_DAYS,createSession,passwordMatches} from '@/lib/auth';
export const runtime='nodejs';
export async function POST(req:Request){try{
 if(!process.env.APP_PASSWORD)return NextResponse.json({error:'A senha do app ainda não foi configurada no servidor (APP_PASSWORD).'},{status:500});
 const {password}=await req.json();
 if(typeof password!=='string'||!(await passwordMatches(password))){await new Promise(r=>setTimeout(r,1000));return NextResponse.json({error:'Senha incorreta.'},{status:401})}
 const res=NextResponse.json({ok:true});
 res.cookies.set(SESSION_COOKIE,await createSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:SESSION_DAYS*86400});
 return res;
 }catch{return NextResponse.json({error:'Não foi possível entrar.'},{status:400})}}
export async function DELETE(){const res=NextResponse.json({ok:true});res.cookies.delete(SESSION_COOKIE);return res}
