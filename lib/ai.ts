export class AIError extends Error{constructor(message:string,public status=502){super(message)}}

export async function callOpenAI(input:Record<string,unknown>,model:string,maxTokens=1500):Promise<Record<string,unknown>>{
 const key=process.env.OPENAI_API_KEY;
 if(!key) throw new AIError('OPENAI_API_KEY não configurada. Adicione nas variáveis de ambiente da Vercel.',500);
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,temperature:0.5,max_tokens:maxTokens,response_format:{type:'json_object'},...input}),cache:'no-store',signal:AbortSignal.timeout(45000)});
 // Não repassa o corpo do erro da OpenAI ao cliente: pode conter detalhes da conta.
 if(!response.ok) throw new AIError(response.status===429?'A IA está sobrecarregada ou sem créditos no momento.':`Falha ao consultar a IA (${response.status}).`);
 const json=await response.json();
 try{const parsed=JSON.parse(json.choices?.[0]?.message?.content||'{}');return parsed&&typeof parsed==='object'?parsed:{}}catch{throw new AIError('A IA devolveu uma resposta incompleta.')}
}

// Remove caracteres de controle e corta o tamanho de qualquer texto livre que vá para um prompt.
export const clean=(text:string,max:number)=>text.replace(/[\u0000-\u001f\u007f<>`]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
