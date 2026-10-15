# NutriDuo Fit 💚

PWA para duas pessoas decidirem o que comer: toque nos ingredientes, fotografe a geladeira ou fale o que tem, e receba ideias de refeições, inclusive uma receita única com porções para cada um ("Cozinhar para nós dois"). Interface em português, pensada para iPhone e instalável na tela de início.

## Rodar no computador

1. Node.js 20.9 ou superior.
2. `npm install`
3. Copie `.env.example` para `.env.local` e preencha `OPENAI_API_KEY`. **Nunca coloque a chave no código do navegador.**
4. `npm run dev` e abra `http://localhost:3000`.

Checagens: `npm run lint` (TypeScript) e `npm run build`.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Obrigatória | Para quê |
|---|---|---|
| `OPENAI_API_KEY` | sim | Sugestões, leitura de foto e transcrição de áudio. Sem ela o app mostra receitas do caderno próprio. |
| `DATABASE_URL` | não | Neon Postgres. Com ela, perfis, favoritas, plano e lista sincronizam entre aparelhos. Sem ela, tudo fica salvo no aparelho. A Vercel preenche sozinha ao conectar o Neon em **Storage**. |
| `APP_PASSWORD` | não | Trava opcional por aparelho (pedida uma vez, vale 180 dias). Recomendado se o link puder circular: protege os dados compartilhados e os créditos da IA. |
| `AI_DAILY_LIMIT` / `AI_PER_MINUTE` | não | Controle de custo (padrão: 150 chamadas/dia, 8 por minuto por IP). |
| `OPENAI_TEXT_MODEL`, `OPENAI_VISION_MODEL`, `OPENAI_TRANSCRIPTION_MODEL` | não | Troca de modelos. |

## Como funciona

- **Entrada:** tela "Quem vai cozinhar hoje?" com dois cards. Um toque e entra, sem senha. A escolha fica salva no aparelho até tocar em "Trocar perfil" ou "Sair". Isso é conveniência de interface, **não** é segurança. Quem protege é a trava opcional `APP_PASSWORD`.
- **Ingredientes:** galeria com fotos por categoria (com busca e itens personalizados), foto da geladeira (a imagem é reduzida no aparelho, analisada pela IA e descartada) e áudio (MediaRecorder com detecção de formato: `audio/mp4` no iPhone, `webm` no Android/Chrome). Foto e áudio só são enviados por ação explícita, e o resultado sempre passa por conferência.
- **Sugestões:** `/api/suggest` valida tudo com Zod, trata as entradas como dados (proteção contra prompt injection), normaliza a resposta da IA e, se ela falhar, devolve receitas do caderno próprio (`lib/recipes.ts`) filtradas pelas restrições.
- **Restrições:** preferência, intolerância, alergia e doença celíaca são tratadas de formas diferentes no prompt e no filtro do caderno.
- **Dados:** tabela `app_state` (chave/valor JSON) e `ai_usage` (contador diário) no Neon, criadas automaticamente.
- **Imagens:** fotos de ingredientes e pratos do [TheMealDB](https://www.themealdb.com), sempre marcadas como ilustrativas e com fallback visual.

## Estrutura

- `app/`: página, layout e rotas de API (`suggest`, `vision`, `transcribe`, `state`, `login`)
- `components/`: telas e componentes visuais
- `hooks/`: estado sincronizado, preferências do aparelho e gravação de áudio
- `lib/`: tipos e validações (Zod), catálogo, normalização/migração, prompts, banco, limite de uso
- `services/api.ts`: cliente das rotas

## Aviso

O NutriDuo é educativo e **não substitui nutricionista ou médico**. Não calcula calorias nem define metas de peso. Em caso de alergia ou doença celíaca, confira rótulos e o risco de contaminação cruzada.
