# NutriDuo Fit 💚

PWA de alimentação e atividade física para Ryan e Chrysalis. Cada pessoa tem seu próprio plano alimentar, receitas salvas, cardápio semanal e treinos; o modo "Cozinhar para nós dois" combina as preferências alimentares só quando é ligado. Interface em português, pensada para iPhone e instalável na tela de início.

## Rodar no computador

1. Node.js 20.9 ou superior.
2. `npm install`
3. Copie `.env.example` para `.env.local` e preencha `OPENAI_API_KEY`. **Nunca coloque a chave no código do navegador.**
4. `npm run dev` e abra `http://localhost:3000`.

Checagens: `npm run lint` (TypeScript), `npm test` (cálculo nutricional, catálogo, filtros, isolamento de perfis, segurança dos exercícios) e `npm run build`.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Obrigatória | Para quê |
|---|---|---|
| `OPENAI_API_KEY` | não | IA que escolhe e explica receitas, lê fotos e transcreve áudio. Sem ela, o app usa o catálogo com filtros determinísticos. |
| `DATABASE_URL` | não | Neon Postgres: sincroniza os dados de cada pessoa entre aparelhos. **Só é usada com `APP_PASSWORD` configurada**; sem isso, tudo fica no aparelho. |
| `APP_PASSWORD` | recomendada | Trava por aparelho (pedida uma vez, vale 180 dias). Protege os dados na nuvem e os créditos da IA. |
| `AI_DAILY_LIMIT` / `AI_PER_MINUTE` | não | Controle de custo (padrão: 150 chamadas/dia, 8 por minuto por IP). |

## Como funciona

- **Perfis isolados:** cada dado pessoal é uma linha própria no banco (`pessoa1:diet`, `pessoa2:plan`…) e um cache próprio no aparelho. A API devolve só a pessoa pedida; no modo casal, o outro perfil entrega apenas preferências e restrições alimentares (nunca peso, observações, plano, favoritos ou treinos). A escolha de perfil por botão é conveniência, não autenticação: o que protege a nuvem é a `APP_PASSWORD`.
- **Catálogo de receitas:** 150 receitas (30 cafés, 40 almoços, 30 lanches, 30 jantares, 20 sobremesas/pré e pós-treino), com ênfase em preparações do Nordeste. Ficam no servidor (`lib/recipes`) e chegam ao celular em páginas de 6.
- **Nutrição determinística** (`lib/nutrition`): cada ingrediente aponta para um alimento do banco (TACO 4ª ed. para alimentos brasileiros, USDA FoodData Central quando necessário), medidas caseiras viram gramas por fatores documentados, os nutrientes são somados e divididos pelo rendimento. Peso da porção usa fatores médios de cozimento. Sem dado confiável, aparece "estimativa indisponível". A IA nunca gera números nutricionais.
- **IA como curadora:** `/api/suggest` filtra candidatas no catálogo (horário, fome, intenção, restrições, ingredientes) e a IA só escolhe ids e explica. Receita inédita só é aceita se todos os ingredientes existirem no banco de alimentos, e é calculada pelo mesmo serviço.
- **Exercícios** (`lib/exercises`): 32 exercícios com demonstração própria (figura em SVG com cinemática inversa: apoios no lugar certo), sessões de 10 a 45 min, protocolos adaptáveis de esteira e bicicleta. Antes de treinar, perguntas de segurança: sem liberação confirmada, só exercícios leves; em recuperação sem liberação, nenhum treino é montado (só organização de orientações e conteúdo educativo); limitações excluem as regiões marcadas.
- **Privacidade:** fotos e áudios vão para a IA só por ação explícita e não são guardados. Dados de saúde pré-preenchidos de versões antigas são removidos por migração.

## Estrutura

- `app/`: página, layout e rotas (`suggest`, `recipes`, `recipes/[id]`, `plan`, `state`, `vision`, `transcribe`, `login`)
- `components/`: telas (Início, Explorar, Minha Dieta, Exercícios, Planejar, Favoritos, Perfil) e componentes
- `hooks/`: estado por pessoa, biblioteca paginada, preferências do aparelho, gravação de áudio
- `lib/nutrition`, `lib/recipes`, `lib/exercises`: dados e regras de domínio (testados em `tests/`)
- `lib/types.ts`: schemas Zod de perfil, plano, receitas, exercícios e sessões

## Aviso

O NutriDuo é educativo e **não substitui nutricionista, médico ou educador físico**. Não define metas de peso nem de calorias. Valores nutricionais são estimativas a partir de tabelas de composição. Em caso de alergia ou doença celíaca, confira rótulos e o risco de contaminação cruzada.
