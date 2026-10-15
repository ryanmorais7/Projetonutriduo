import path from 'node:path';
import type {NextConfig} from 'next';
// outputFileTracingRoot fixa a raiz do projeto (há outro package-lock.json acima desta pasta na máquina local).
const nextConfig:NextConfig={reactStrictMode:true,outputFileTracingRoot:path.join(__dirname)};
export default nextConfig;
