import {NextResponse} from 'next/server';
import {clean} from '@/lib/ai';
import {guardAI} from '@/lib/rateLimit';
export const runtime='nodejs';
// iPhone grava em audio/mp4; Chrome/Android em audio/webm. O áudio não é guardado.
const ALLOWED=['audio/webm','audio/mp4','audio/m4a','audio/x-m4a','audio/aac','audio/mpeg','audio/ogg','audio/wav','video/mp4','video/webm'];
const MAX=8*1024*1024;
export async function POST(req:Request){
 const key=process.env.OPENAI_API_KEY;if(!key)return NextResponse.json({error:'Configure OPENAI_API_KEY no servidor.'},{status:500});
 const form=await req.formData().catch(()=>null);const file=form?.get('audio');
 if(!(file instanceof File)||file.size===0)return NextResponse.json({error:'Não recebi o áudio. Grave de novo.'},{status:400});
 if(file.size>MAX)return NextResponse.json({error:'Áudio muito longo. Fale em até 1 minuto.'},{status:413});
 const type=file.type.split(';')[0].trim().toLowerCase();
 if(type&&!ALLOWED.includes(type))return NextResponse.json({error:'Formato de áudio não suportado neste navegador.'},{status:415});
 const limited=await guardAI(req);if(limited)return limited;
 try{
  const body=new FormData();body.append('file',file,file.name||'audio.webm');body.append('model',process.env.OPENAI_TRANSCRIPTION_MODEL||'gpt-4o-mini-transcribe');body.append('language','pt');
  body.append('prompt','Lista de alimentos e ingredientes de cozinha.');
  const response=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${key}`},body,signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw new Error(response.status===400?'O áudio não pôde ser lido. Tente gravar de novo.':'Falha ao transcrever o áudio.');
  const data=await response.json();return NextResponse.json({text:clean(String(data.text||''),600)});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao transcrever'},{status:502})}
}
