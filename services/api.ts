import type {StateKey,SuggestRequest,SuggestResponse} from '@/lib/types';

export class ApiError extends Error{constructor(message:string,public status:number,public code?:string){super(message)}}

async function call<T>(path:string,init?:RequestInit):Promise<T>{
 let r:Response;
 try{r=await fetch(path,{cache:'no-store',...init})}
 catch{throw new ApiError(typeof navigator!=='undefined'&&!navigator.onLine?'Você está sem internet. Confira a conexão e tente de novo.':'Não consegui falar com o servidor. Tente de novo.',0,'offline')}
 if(r.status===401){location.href='/login';throw new ApiError('Este aparelho precisa ser desbloqueado.',401)}
 const json=await r.json().catch(()=>({})) as {error?:string,code?:string};
 if(!r.ok)throw new ApiError(json.error||'Algo deu errado. Tente de novo.',r.status,json.code);
 return json as T;
}
const jsonInit=(method:string,body:unknown):RequestInit=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});

export type VisionItem={name:string,confidence:string};
export const api={
 suggest:(body:SuggestRequest)=>call<SuggestResponse>('/api/suggest',jsonInit('POST',body)),
 vision:(image:string)=>call<{items:VisionItem[],warning:string}>('/api/vision',jsonInit('POST',{image})),
 transcribe:(blob:Blob)=>{const form=new FormData();form.append('audio',blob,blob.type.includes('mp4')?'fala.m4a':blob.type.includes('ogg')?'fala.ogg':'fala.webm');return call<{text:string}>('/api/transcribe',{method:'POST',body:form})},
 getState:()=>call<Partial<Record<StateKey,unknown>>>('/api/state'),
 putState:(patch:Partial<Record<StateKey,unknown>>)=>call<{ok:true}>('/api/state',jsonInit('PUT',patch)),
 deleteState:()=>call<{ok:true}>('/api/state',{method:'DELETE'}),
};
