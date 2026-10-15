import {NextResponse} from 'next/server';
import {callOpenAI,clean} from '@/lib/ai';
import {normalizeSuggestion} from '@/lib/normalize';
import {SUGGEST_SYSTEM,buildSuggestInput} from '@/lib/prompts';
import {guardAI} from '@/lib/rateLimit';
import {fallbackSuggestions} from '@/lib/recipes';
import {suggestRequestSchema,type SuggestResponse,type Suggestion} from '@/lib/types';
export const runtime='nodejs';

const NOTICE='Sugestões educativas, não substituem orientação de nutricionista ou médico. Em caso de alergia, confira rótulos e contaminação cruzada.';

export async function POST(req:Request){
 const parsed=suggestRequestSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Não entendi o pedido. Confira as escolhas e tente de novo.'},{status:400});
 const data=parsed.data;
 const limited=await guardAI(req);if(limited)return limited;
 const mode=data.kind==='delivery'?'delivery':'casa';
 try{
  const raw=await callOpenAI({messages:[{role:'system',content:SUGGEST_SYSTEM},{role:'user',content:buildSuggestInput(data)}]},process.env.OPENAI_TEXT_MODEL||'gpt-4.1-mini',900*data.count+400);
  const list=Array.isArray(raw.suggestions)?raw.suggestions:[];
  const suggestions=list.map(s=>normalizeSuggestion({...(s as object),mode,forWho:data.forWho,id:undefined},{forWho:data.forWho,mode})).filter((s):s is Suggestion=>!!s).slice(0,data.count);
  if(!suggestions.length)throw new Error('Resposta vazia da IA.');
  const body:SuggestResponse={intro:clean(String(raw.intro||''),240),suggestions,tip:clean(String(raw.tip||''),240),notice:NOTICE,fallback:false};
  return NextResponse.json(body);
 }catch(e){
  // Falhou a IA: entrega receitas do caderno próprio em vez de uma tela de erro.
  const suggestions=fallbackSuggestions(data);
  const reason=e instanceof Error?e.message:'erro desconhecido';
  if(!suggestions.length)return NextResponse.json({error:`Não consegui gerar ideias agora (${reason}). Tente de novo em instantes.`},{status:502});
  const body:SuggestResponse={intro:mode==='delivery'?'A IA não respondeu agora, então separei ideias gerais de pedido.':'A IA não respondeu agora, então separei receitas do nosso caderno que combinam com o que você tem.',suggestions,tip:'',notice:`${NOTICE} (Motivo: ${reason})`,fallback:true};
  return NextResponse.json(body);
 }
}
