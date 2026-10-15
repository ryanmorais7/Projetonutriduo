'use client';
import {useState} from 'react';
import {Heart,Search,X} from 'lucide-react';
import {norm} from '@/lib/catalog';
import type {Suggestion} from '@/lib/types';
import {MiniRecipe} from './Recipe';
import {Empty} from './ui';

export function FavoritesView({saved,onFav,onOpen,onExplore}:{saved:Suggestion[],onFav:(r:Suggestion)=>void,onOpen:(r:Suggestion)=>void,onExplore:()=>void}){
 const [q,setQ]=useState('');
 const list=q?saved.filter(r=>norm(r.title+' '+r.highlights.join(' ')).includes(norm(q))):saved;
 return <div className="view">
  <section className="page-head"><h1>Favoritas</h1><p>O caderno de receitas de vocês. Toque no coração para guardar.</p></section>
  {saved.length>0&&<div className="search"><Search size={18} aria-hidden/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar nas favoritas" aria-label="Buscar nas favoritas"/>{q&&<button className="icon-btn" onClick={()=>setQ('')} aria-label="Limpar busca"><X size={16}/></button>}</div>}
  {!saved.length?<Empty icon={<Heart size={28}/>} title="Ainda está vazio" text="Quando uma receita agradar, toque no coração para guardar aqui." action={<button className="btn primary" onClick={onExplore}>Buscar ideias</button>}/>:
   <div className="fav-grid">{list.map(r=><MiniRecipe key={r.id} r={r} fav onFav={()=>onFav(r)} onOpen={()=>onOpen(r)}/>)}</div>}
  {saved.length>0&&!list.length&&<p className="muted center">Nenhuma favorita com esse nome.</p>}
 </div>;
}
