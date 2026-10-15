'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {RecipeSearch,Suggestion} from '@/lib/types';
import {api} from '@/services/api';

export type LibFilters={
 q:string,meal?:'cafe'|'almoco'|'lanche'|'jantar'|'sobremesa',maxTime?:number,
 goal?:'equilibrada'|'proteica'|'energetica'|'leve'|'economica',avail?:'todos'|'falta1'|'geladeira'|'comprar',
 noLactose:boolean,noGluten:boolean,vegetarian:boolean,without:string,personal:boolean,
};
export const EMPTY_FILTERS:LibFilters={q:'',noLactose:false,noGluten:false,vegetarian:false,without:'',personal:true};
const PAGE=6;

// Biblioteca com carregamento progressivo: 6 receitas por vez, filtros e ingredientes preservados ao pedir mais.
export function useLibrary(personal:NonNullable<RecipeSearch['personal']>,have:string[]){
 const [filters,setFilters]=useState<LibFilters>(EMPTY_FILTERS);
 const [similar,setSimilar]=useState<{id:string,title:string}|null>(null);
 const [seed,setSeed]=useState<number|undefined>(undefined);
 const [items,setItems]=useState<Suggestion[]>([]),[total,setTotal]=useState(0),[hasMore,setHasMore]=useState(false);
 const [loading,setLoading]=useState(false),[error,setError]=useState(''),[page,setPage]=useState(0);
 const hidden=useRef<Set<string>>(new Set());
 const req=useRef(0);
 const personalKey=JSON.stringify(personal),haveKey=JSON.stringify(have);

 const build=useCallback((p:number):RecipeSearch=>({
  q:filters.q.trim()||undefined,meal:filters.meal,maxTime:filters.maxTime,goal:filters.goal,avail:filters.avail,
  have,noLactose:filters.noLactose||undefined,noGluten:filters.noGluten||undefined,vegetarian:filters.vegetarian||undefined,
  without:filters.without.trim()||undefined,personal:filters.personal?personal:{flags:[],avoid:[],likes:[],hidden:personal.hidden},
  exclude:[...hidden.current],similarTo:similar?.id,seed,page:p,pageSize:PAGE,
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }),[filters,similar?.id,seed,personalKey,haveKey]);

 const fetchPage=useCallback(async(p:number)=>{
  const id=++req.current;setLoading(true);setError('');
  try{const r=await api.recipes(build(p));if(id!==req.current)return;setItems(prev=>p===0?r.items:[...prev,...r.items.filter(x=>!prev.some(y=>y.id===x.id))]);setTotal(r.total);setHasMore(r.hasMore);setPage(p)}
  catch(e){if(id===req.current)setError(e instanceof Error?e.message:'Não consegui carregar as receitas.')}
  finally{if(id===req.current)setLoading(false)}
 },[build]);

 useEffect(()=>{const t=setTimeout(()=>fetchPage(0),filters.q?300:0);return()=>clearTimeout(t)},[fetchPage,filters.q]);

 return {
  filters,setFilters,similar,setSimilar,items,total,hasMore,loading,error,
  loadMore:()=>fetchPage(page+1),
  surprise:()=>setSeed(Math.floor(Math.random()*1e6)),
  hide:(id:string)=>{hidden.current.add(id);setItems(list=>list.filter(x=>x.id!==id));setTotal(t=>Math.max(0,t-1))},
  reset:()=>{setFilters(EMPTY_FILTERS);setSimilar(null)},
 };
}
export type Library=ReturnType<typeof useLibrary>;
