import {NextResponse,type NextRequest} from 'next/server';
import {SESSION_COOKIE,verifySession} from '@/lib/auth';
// Trava opcional por aparelho: só existe se APP_PASSWORD estiver configurada. A escolha de perfil
// (Ryan/Chrysalis) é conveniência de interface, não segurança; esta trava é o que protege dados e custos.
export async function middleware(req:NextRequest){
 if(!process.env.APP_PASSWORD)return NextResponse.next();
 if(await verifySession(req.cookies.get(SESSION_COOKIE)?.value))return NextResponse.next();
 if(req.nextUrl.pathname.startsWith('/api/'))return NextResponse.json({error:'Este aparelho precisa ser desbloqueado de novo.'},{status:401});
 return NextResponse.redirect(new URL('/login',req.url));
}
// Node.js lê APP_PASSWORD em tempo de execução; no runtime edge ela pode ficar congelada no valor do build.
export const config={runtime:'nodejs',matcher:['/((?!login|api/login|_next/|icons/|manifest.webmanifest|sw.js|favicon).*)']};
