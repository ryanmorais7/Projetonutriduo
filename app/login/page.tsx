'use client';
import {useState} from 'react';
import {Leaf,LoaderCircle,Lock} from 'lucide-react';
// Só aparece se APP_PASSWORD estiver configurada: desbloqueio único por aparelho (180 dias), não é login por pessoa.
export default function UnlockPage(){
 const [password,setPassword]=useState(''),[loading,setLoading]=useState(false),[message,setMessage]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();if(!password)return;setLoading(true);setMessage('');try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível desbloquear.');location.href='/'}catch(err){setMessage(err instanceof Error?err.message:'Não foi possível desbloquear.');setLoading(false)}}
 return <div className="picker">
  <div className="picker-brand"><span className="brandmark"><Leaf size={20}/></span><strong>nutri<span>duo</span></strong></div>
  <h1>Desbloquear este aparelho</h1>
  <p>Só uma vez por aparelho. Depois é só tocar no seu perfil, sem senha.</p>
  <form className="unlock" onSubmit={submit}>
   <label className="field"><span>Código do casal</span><input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} autoFocus/></label>
   <button className="btn primary big full" type="submit" disabled={loading||!password}>{loading?<LoaderCircle className="spin" size={19}/>:<Lock size={19}/>}{loading?'Desbloqueando…':'Desbloquear'}</button>
   {message&&<div className="alert" role="alert">{message}</div>}
  </form>
 </div>;
}
