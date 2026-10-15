'use client';
import {useMemo,useState} from 'react';
import {Check,Plus,Search,X} from 'lucide-react';
import {CATEGORIES,INGREDIENTS,ingredientImage,norm,type Category} from '@/lib/catalog';
import {Img} from './ui';

// Galeria de ingredientes com fotos, categorias e busca: usada no "O que tenho" e no "Montar dieta".
export function IngredientGrid({selected,onToggle,onAddCustom,title}:{selected:string[],onToggle:(name:string)=>void,onAddCustom?:(name:string)=>void,title?:string}){
 const [cat,setCat]=useState<Category|'todos'>('todos'),[query,setQuery]=useState('');
 const keys=useMemo(()=>new Set(selected.map(norm)),[selected]);
 const q=norm(query);
 const list=INGREDIENTS.filter(i=>(cat==='todos'||i.category===cat)&&(!q||norm(i.name).includes(q)||i.aliases.some(a=>norm(a).includes(q))));
 const custom=()=>{const t=query.trim().slice(0,60);if(t.length<2||!onAddCustom)return;onAddCustom(t.charAt(0).toUpperCase()+t.slice(1));setQuery('')};
 return <section className="gallery">
  {title&&<h2 className="sec-title">{title}</h2>}
  <div className="search"><Search size={18} aria-hidden/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!list.length)custom()}} placeholder={onAddCustom?'Buscar ou adicionar ingrediente':'Buscar ingrediente'} aria-label="Buscar ingrediente"/>{query&&<button className="icon-btn" onClick={()=>setQuery('')} aria-label="Limpar busca"><X size={16}/></button>}</div>
  <div className="cat-row" role="tablist" aria-label="Categorias">{[{key:'todos' as const,label:'Todos'},...CATEGORIES].map(c=><button key={c.key} role="tab" aria-selected={cat===c.key} className={`chip ${cat===c.key?'on':''}`} onClick={()=>setCat(c.key)}>{c.label}</button>)}</div>
  {onAddCustom&&query.trim().length>1&&!INGREDIENTS.some(i=>norm(i.name)===q)&&<button className="add-custom" onClick={custom}><Plus size={17}/>Adicionar “{query.trim()}”</button>}
  <div className="ing-grid">{list.map(i=>{const on=keys.has(norm(i.name));return <button key={i.id} className={`ing ${on?'on':''}`} aria-pressed={on} onClick={()=>onToggle(i.name)}>
   <span className="ing-img"><Img src={ingredientImage(i.img)} alt=""/></span><span className="ing-name">{i.name}</span><span className="ing-check" aria-hidden>{on?<Check size={14}/>:<Plus size={14}/>}</span>
  </button>})}</div>
  {!list.length&&<p className="muted center">Nada com esse nome na galeria.{onAddCustom?' Toque em “Adicionar” acima.':''}</p>}
 </section>;
}
