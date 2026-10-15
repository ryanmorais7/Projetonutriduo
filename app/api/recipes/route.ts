import {NextResponse} from 'next/server';
import {searchRecipes} from '@/lib/recipes';
import {recipeSearchSchema} from '@/lib/types';
export const runtime='nodejs';
// Busca paginada no catálogo (sem IA). POST para não expor restrições pessoais na URL e nos logs.
export async function POST(req:Request){
 const parsed=recipeSearchSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Filtros inválidos.'},{status:400});
 return NextResponse.json(searchRecipes(parsed.data),{headers:{'Cache-Control':'no-store'}});
}
