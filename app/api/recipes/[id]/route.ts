import {NextResponse} from 'next/server';
import {getRecipe,toDetail} from '@/lib/recipes';
export const runtime='nodejs';
// Detalhe de uma receita do catálogo (ingredientes estruturados para o cálculo nutricional no aparelho).
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const r=getRecipe(id);
 if(!r)return NextResponse.json({error:'Receita não encontrada.'},{status:404});
 return NextResponse.json(toDetail(r),{headers:{'Cache-Control':'public, max-age=3600'}});
}
