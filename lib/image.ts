// Reduz a foto no próprio aparelho antes do envio: menos dados móveis, menos custo de IA e nada de foto original no servidor.
export async function compressImage(file:File,maxSide=1280,quality=0.8):Promise<string>{
 if(file.type&&!file.type.startsWith('image/'))throw new Error('Escolha um arquivo de imagem.');
 if(file.size>20*1024*1024)throw new Error('Imagem muito grande. Escolha uma de até 20 MB.');
 const url=URL.createObjectURL(file);
 try{
  const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Não consegui abrir essa imagem. Tente uma foto JPG ou PNG.'));i.src=url});
  const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Seu navegador não conseguiu preparar a foto.');
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',quality);
 }finally{URL.revokeObjectURL(url)}
}
