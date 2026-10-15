import type {Metadata,Viewport} from 'next';
import {Manrope} from 'next/font/google';
import './globals.css';
const manrope=Manrope({subsets:['latin'],display:'swap',variable:'--font'});
export const metadata:Metadata={title:'NutriDuo Fit | Comer bem, juntos',description:'Ideias de refeições para dois: toque nos ingredientes, fotografe a geladeira ou fale o que tem.',applicationName:'NutriDuo',appleWebApp:{capable:true,title:'NutriDuo',statusBarStyle:'default'},formatDetection:{telephone:false},icons:{icon:[{url:'/icons/icon-192.png',sizes:'192x192'},{url:'/icons/icon.svg',type:'image/svg+xml'}],apple:'/icons/apple-touch-icon.png'},manifest:'/manifest.webmanifest'};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',interactiveWidget:'resizes-content',themeColor:[{media:'(prefers-color-scheme: light)',color:'#f6f4ec'},{media:'(prefers-color-scheme: dark)',color:'#121714'}]};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR" className={manrope.variable}><body><a className="skip" href="#conteudo">Pular para o conteúdo</a>{children}</body></html>}
