export const SESSION_COOKIE='nutriduo_session';
export const SESSION_DAYS=180;
const enc=new TextEncoder();
// Assina com a própria APP_PASSWORD: trocar a senha derruba todas as sessões abertas.
async function hmac(data:string){const secret=process.env.APP_PASSWORD;if(!secret)throw new Error('APP_PASSWORD não configurada.');const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,enc.encode(data));return Array.from(new Uint8Array(sig),b=>b.toString(16).padStart(2,'0')).join('')}
function safeEqual(a:string,b:string){if(a.length!==b.length)return false;let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0}
export async function passwordMatches(input:string){const pw=process.env.APP_PASSWORD;if(!pw)return false;return safeEqual(await hmac(`pw:${input}`),await hmac(`pw:${pw}`))}
export async function createSession(){const exp=String(Date.now()+SESSION_DAYS*864e5);return `${exp}.${await hmac(exp)}`}
export async function verifySession(token?:string){if(!token||!process.env.APP_PASSWORD)return false;const [exp,sig]=token.split('.');if(!exp||!sig||!(Number(exp)>Date.now()))return false;return safeEqual(sig,await hmac(exp))}
