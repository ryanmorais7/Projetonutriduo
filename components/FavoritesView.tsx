'use client';
import {useState} from 'react';
import {Bookmark,Heart,Search,X} from 'lucide-react';
import {norm} from '@/lib/catalog';
import type {Suggestion} from '@/lib/types';
import type {CardHandlers} from './Explore';
import {RecipeCard} from './Recipe';
import {Empty,Segmented} from './ui';

export function FavoritesView({saved,later,cards,onExplore}:{saved:Suggestion[],later:Suggestion[],cards:CardHandlers,onExplore:()=>void}){
 const [tab,setTab]=useState<'fav'|'later'>('fav'),[q,setQ]=useState('');
 const source=tab==='fav'?saved:later;
 const list=q?source.filter(r=>norm(r.title+' '+r.highlights.join(' ')).includes(norm(q))):source;
 return <div className="view">
  <section className="page-head"><h1>Favoritos</h1><p>Suas receitas guardadas. Só você vê esta lista.</p></section>
  <Segmented label="Lista" value={tab} onChange={setTab} options={[{value:'fav',label:`Favoritas · ${saved.length}`,icon:<Heart size={16}/>},{value:'later',label:`Para depois · ${later.length}`,icon:<Bookmark size={16}/>}]}/>
  {source.length>0&&<div className="search spaced"><Search size={18} aria-hidden/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar nesta lista" aria-label="Buscar"/>{q&&<button className="icon-btn" onClick={()=>setQ('')} aria-label="Limpar busca"><X size={16}/></button>}</div>}
  {!source.length?<Empty icon={tab==='fav'?<Heart size={28}/>:<Bookmark size={28}/>} title="Ainda está vazio" text={tab==='fav'?'Toque no coração de uma receita para guardar aqui.':'Use “Salvar para depois” nas receitas que quer testar.'} action={<button className="btn primary" onClick={onExplore}>Explorar receitas</button>}/>:
   <div className="card-grid">{list.map(r=><RecipeCard key={r.id} r={r} variant="grid" fav={cards.isFav(r)} onFav={()=>cards.toggleFav(r)} onOpen={()=>cards.open(r)} compat={cards.compat(r)} later={cards.isLater(r)} onLater={()=>cards.toggleLater(r)} onSimilar={()=>cards.similar(r)}/>)}</div>}
  {source.length>0&&!list.length&&<p className="muted center">Nada com esse nome.</p>}
 </div>;
}
