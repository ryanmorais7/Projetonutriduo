'use client';
import {useCallback,useEffect,useRef,useState} from 'react';

// iPhone (Safari) só grava audio/mp4; Chrome/Android preferem webm. Detecta o que o navegador suporta.
const TYPES=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];

export function useRecorder(onFinish:(blob:Blob)=>void,maxSeconds=60){
 const [recording,setRecording]=useState(false),[seconds,setSeconds]=useState(0),[error,setError]=useState('');
 const rec=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),chunks=useRef<Blob[]>([]),timer=useRef<ReturnType<typeof setInterval>|null>(null),keep=useRef(false),finish=useRef(onFinish);
 finish.current=onFinish;
 const cleanup=useCallback(()=>{if(timer.current)clearInterval(timer.current);timer.current=null;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;rec.current=null;setRecording(false)},[]);
 const stop=useCallback(()=>{keep.current=true;if(rec.current?.state==='recording')rec.current.stop()},[]);
 const cancel=useCallback(()=>{keep.current=false;if(rec.current?.state==='recording')rec.current.stop();else cleanup()},[cleanup]);
 const start=useCallback(async()=>{
  setError('');
  if(typeof window==='undefined'||!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('Este navegador não permite gravar áudio aqui. Use a galeria ou a foto.');return}
  try{stream.current=await navigator.mediaDevices.getUserMedia({audio:true})}
  catch(e){const n=(e as DOMException)?.name;setError(n==='NotAllowedError'?'O microfone está bloqueado. Libere em Ajustes › Safari › Microfone (ou nas permissões do navegador) e tente de novo.':n==='NotFoundError'?'Não encontrei um microfone neste aparelho.':'Não consegui acessar o microfone.');return}
  const type=TYPES.find(t=>MediaRecorder.isTypeSupported?.(t));
  let mr:MediaRecorder;
  try{mr=new MediaRecorder(stream.current,type?{mimeType:type}:undefined)}catch{cleanup();setError('Formato de gravação não suportado neste navegador.');return}
  chunks.current=[];keep.current=false;
  mr.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)};
  mr.onstop=()=>{const blob=new Blob(chunks.current,{type:mr.mimeType||type||'audio/mp4'});const ok=keep.current;cleanup();if(ok){if(blob.size<800)setError('Não ouvi nada. Tente falar mais perto do microfone.');else finish.current(blob)}};
  mr.start();rec.current=mr;setSeconds(0);setRecording(true);
  timer.current=setInterval(()=>setSeconds(s=>{if(s+1>=maxSeconds)stop();return s+1}),1000);
 },[cleanup,maxSeconds,stop]);
 useEffect(()=>()=>{keep.current=false;if(rec.current?.state==='recording')rec.current.stop();cleanup()},[cleanup]);
 return {recording,seconds,error,setError,start,stop,cancel};
}
