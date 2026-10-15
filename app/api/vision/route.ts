import {NextResponse} from 'next/server';
import {callOpenAI,clean} from '@/lib/ai';
import {VISION_SYSTEM} from '@/lib/prompts';
import {guardAI} from '@/lib/rateLimit';
export const runtime='nodejs';
// A foto é só repassada à IA e descartada: nada é salvo no servidor.
const MAX_CHARS=4_500_000;
export async function POST(req:Request){
 const body=await req.json().catch(()=>null) as {image?:unknown}|null;
 const image=body?.image;
 if(typeof image!=='string'||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]/.test(image)||/[^A-Za-z0-9+/=]/.test(image.slice(image.indexOf(',')+1,image.indexOf(',')+2000)))return NextResponse.json({error:'Formato de imagem não suportado. Use JPG, PNG ou WebP.'},{status:400});
 if(image.length>MAX_CHARS)return NextResponse.json({error:'A foto ficou grande demais. Tente outra com menos zoom.'},{status:413});
 const limited=await guardAI(req);if(limited)return limited;
 try{
  const data=await callOpenAI({messages:[{role:'system',content:VISION_SYSTEM},{role:'user',content:[{type:'text',text:'Quais ingredientes aparecem nesta foto?'},{type:'image_url',image_url:{url:image,detail:'low'}}]}]},process.env.OPENAI_VISION_MODEL||'gpt-4.1-mini',500);
  const items=(Array.isArray(data.items)?data.items:[]).map(x=>{const o=(typeof x==='string'?{name:x}:x||{}) as {name?:unknown,confidence?:unknown};return {name:clean(String(o.name||''),40),confidence:['alta','media','baixa'].includes(String(o.confidence))?String(o.confidence):'media'}})
   .filter(x=>x.name.length>1&&/[a-zà-ú]/i.test(x.name)&&!/[{}\[\]=:;/\\]|https?/i.test(x.name)).slice(0,25);
  return NextResponse.json({items,warning:clean(String(data.warning||''),200)||'Confira a lista: a foto pode não mostrar tudo.'});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Não consegui analisar a foto.'},{status:502})}
}
