# Lança-Penas: como publicar na Google Play

Dois produtos saem do mesmo código:

| Versão | Onde | Conteúdo |
| --- | --- | --- |
| Web | `index.html` (link do Claude ou GitHub Pages) | Completa e grátis |
| App Android | pasta `android/` | Mundo 1 grátis + compra única "Jogo completo" |

A diferença é só a linha `window.LP_EDITION = 'store'`, que o `npm run build` coloca na cópia do app (pasta `www/`).

## 1. Antes de tudo (decisões que não dá para mudar depois)

- **Nome do pacote:** hoje está `com.lancapenas.jogo` em `capacitor.config.json` e `android/app/build.gradle`. Depois do primeiro envio à Play Store ele não pode mudar. Se tiver um domínio próprio, use-o ao contrário (ex.: `br.com.seudominio.lancapenas`).
- **Licença das vozes:** as falas em `audio/` foram geradas na Fish Audio com modelos de voz da comunidade. Confirme no seu plano se o uso comercial é permitido e se esses dois modelos podem ser usados em produto pago. Se não puder, troque por vozes com licença comercial e rode `scripts/` de novo (ou grave as falas).
- **E-mail de contato:** preencha em `politica-de-privacidade.html` e publique essa página num endereço público (ex.: GitHub Pages).

## 2. Gerar o app no Windows

1. Instale o **Node.js 22** e o **Android Studio** (versão atual).
2. Na pasta do projeto:
   ```
   npm install
   npm run android
   ```
   Isso gera a pasta `www/`, copia para o Android e abre o Android Studio.
3. No Android Studio: **Build > Generate Signed App Bundle** → crie a **chave de assinatura** (guarde o arquivo `.jks` e as senhas num lugar seguro; sem ela você não atualiza o app) → gere o `.aab`.
4. Para testar no celular antes: ative o modo desenvolvedor, conecte por USB e clique em **Run**.

Sempre que mudar o jogo: `npm run sync` e gere o `.aab` de novo, aumentando `versionCode` em `android/app/build.gradle`.

## 3. Play Console

1. Crie a conta de desenvolvedor (taxa única de US$ 25). Conta pessoal nova exige **teste fechado com pelo menos 12 testadores por 14 dias** antes de publicar em produção (confirme a regra atual na hora).
2. Crie o app → envie o `.aab` numa faixa de **teste fechado**.
3. **Produto da compra:** Monetizar > Produtos > Produtos no app → criar com o ID **`jogo_completo`** (exatamente assim), tipo único, preço sugerido R$ 9,90 a R$ 14,90, e ativar. O produto só aparece no app instalado pela Play Store (faixa de teste), não no app instalado por USB.
4. **Testadores de compra:** Configurações > Teste de licença → adicione os e-mails dos testadores para comprar sem cobrança real.

## 4. Formulários obrigatórios (respostas sugeridas)

- **Público-alvo:** até 5 anos e 6 a 8 anos. Isso coloca o app na Política de Famílias.
- **Anúncios:** "Não, meu app não contém anúncios".
- **Segurança dos dados:** o app **não coleta nem compartilha** dados do usuário. Os dados ficam só no aparelho. As compras são processadas pelo Google Play.
- **Classificação de conteúdo (IARC):** jogo; sem violência realista (as galinhas saem voando, sem ferimentos), sem compras de itens aleatórios, sem interação entre usuários.
- **Política de privacidade:** link público da página `politica-de-privacidade.html`.
- **Permissões:** internet (para a compra) e cobrança. Nenhuma outra.

## 5. Texto da loja (rascunho)

**Título:** Lança-Penas: galinhas voadoras

**Descrição curta:** Mire, lance e faça as galinhas voarem! Números, cores, formas e letras.

**Descrição completa:**
Lança-Penas é um jogo de mirar e lançar para crianças pequenas. Segure o dedo para ganhar força, solte e veja as galinhas saírem voando entre penas e confete!

• Aprende brincando: a narradora conta os acertos, ensina cores, formas e forma palavras como OVO, SOL, GATO, PATO e BOLA
• A lança fica presa onde bater e o próximo tiro sai de lá: cada fase é um quebra-cabeça
• Almofadas que quicam, vidro, portais, lança tripla, lança ímã, confete e a galinha rainha
• Álbum com 24 figurinhas de galinhas engraçadas
• Diz o nome da criança nas vitórias
• Sem anúncios. Sem caixas-surpresa. Funciona sem internet.

O primeiro mundo é grátis. Os outros 3 mundos são liberados com um pagamento único, protegido por uma pergunta para adultos.

## 6. Depois de publicar

- Acompanhe a taxa de conversão (quantos instalam vs. quantos compram) no Play Console. Abaixo de 2% indica que o preço ou o mundo grátis precisam de ajuste.
- Atualizações pequenas e raras: o objetivo é baixa manutenção.

## 7. Versão web instalável (sem Play Store)

A versão web já vem pronta para ser instalada como app (PWA): `manifest.webmanifest`, `sw.js` e a pasta `icons/`. Depois de aberta uma vez, ela funciona sem internet.

1. Hospede a pasta do projeto em HTTPS, por exemplo no **GitHub Pages**: no GitHub, Settings > Pages > Source: "Deploy from a branch" > escolha a branch e a pasta raiz. Repositório privado só tem Pages em plano pago; nesse caso use outro serviço estático (Cloudflare Pages, Netlify).
2. No celular, abra o endereço no Chrome (Android) ou Safari (iPhone) e use **"Adicionar à tela inicial"**.

Essa versão é completa e grátis (para a família). Se publicar o endereço abertamente, ela concorre com o app pago.

## 8. Área dos pais

Na tela inicial, o botão ⚙️ abre a Área dos pais (protegida pela pergunta de multiplicação):

- **Dificuldade:** Fácil (+2 lanças, galinhas maiores para acertar e mais lentas), Normal ou Desafio.
- **Tempo de jogo:** Livre, 15, 30 ou 45 minutos. Ao acabar, o jogo termina a fase atual e mostra "Hora de descansar" por 20 minutos. Abrir a Área dos pais encerra o descanso.
- **Nome e voz** e **Apagar progresso** (mantém compra, nome e preferências).
