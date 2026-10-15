import type {PersonId,PersonKey,PublicProfiles,RecipeDetailDTO,RecipeSearch,RecipeSearchResult,SuggestRequest,SuggestResponse,Suggestion} from '@/lib/types';

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
 recipes:(search:RecipeSearch)=>call<RecipeSearchResult>('/api/recipes',jsonInit('POST',search)),
 recipe:(id:string)=>call<RecipeDetailDTO>(`/api/recipes/${encodeURIComponent(id)}`,{cache:'default'}),
 plan:(body:{slots:{key:string,meal:'cafe'|'almoco'|'lanche'|'jantar'}[],keep:string[],search:RecipeSearch,forWho:string,seed?:number})=>call<{entries:Record<string,Suggestion>}>('/api/plan',jsonInit('POST',body)),
 getPerson:(id:PersonId)=>call<Partial<Record<PersonKey|'public',unknown>>>(`/api/state?person=${id}`),
 getCouple:(id:PersonId)=>call<{diet:unknown}>(`/api/state?person=${id}&scope=couple`),
 putState:(body:{person:PersonId,patch?:Partial<Record<PersonKey,unknown>>,public?:PublicProfiles})=>call<{ok:true}>('/api/state',jsonInit('PUT',body)),
 deletePerson:(id:PersonId)=>call<{ok:true}>(`/api/state?person=${id}`,{method:'DELETE'}),
};
