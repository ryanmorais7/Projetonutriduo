import {NextResponse} from 'next/server';
import {z} from 'zod';
import {planMeals} from '@/lib/recipes';
import {recipeSearchSchema} from '@/lib/types';
export const runtime='nodejs';
// Monta o cardápio semanal (ou só um dia / uma refeição) a partir do catálogo validado, sem IA.
const schema=z.object({
 slots:z.array(z.object({key:z.string().regex(/^(seg|ter|qua|qui|sex|sab|dom)-(cafe|almoco|lanche|jantar)$/),meal:z.enum(['cafe','almoco','lanche','jantar'])})).min(1).max(28),
 keep:z.array(z.string().max(60)).max(28),
 search:recipeSearchSchema.omit({page:true,pageSize:true}),
 forWho:z.enum(['ambos','pessoa1','pessoa2']),
 seed:z.number().int().optional(),
});
export async function POST(req:Request){
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:'Pedido inválido.'},{status:400});
 return NextResponse.json({entries:planMeals(parsed.data)});
}
