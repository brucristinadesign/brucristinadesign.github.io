# Sincronizar em tempo real (Daniel & Bruna nos dois celulares)

O app já funciona sozinho em cada aparelho. Para os dois verem tudo
**atualizado na hora**, é preciso ligar o Firebase — um serviço grátis do
Google. Leva ~5 minutos e é feito **uma vez só**.

## Passo a passo

### 1. Criar o projeto
1. Acesse <https://console.firebase.google.com> e faça login com uma conta
   Google (pode ser a de qualquer um dos dois — os dados ficam nesse projeto).
2. Clique em **"Adicionar projeto"**, dê um nome (ex: `financas-casal`),
   avance e crie. Pode desligar o Google Analytics, não é necessário.

### 2. Ligar o banco de dados em tempo real
1. No menu à esquerda: **Criar › Realtime Database**.
2. Clique em **"Criar banco de dados"**.
3. Escolha a localização (pode deixar a padrão) e selecione **"Iniciar no
   modo de teste"** por enquanto (a gente tranca no passo 5).

### 3. Ligar o login anônimo (protege seus dados de estranhos)
1. No menu: **Criar › Authentication › Vamos começar**.
2. Aba **"Sign-in method"** › clique em **"Anônimo"** › **Ativar** › Salvar.

### 4. Pegar a configuração e colar no app
1. Clique na engrenagem ⚙ (canto superior esquerdo) › **"Configurações do
   projeto"**.
2. Role até **"Seus apps"** › clique no ícone **Web** `</>`.
3. Dê um apelido (ex: `app`) e registre. Vai aparecer um bloco
   `const firebaseConfig = { ... }`.
4. Copie **todos** os valores e cole no arquivo
   [`financas/firebase-config.js`](firebase-config.js), incluindo o
   **`databaseURL`** (algo como
   `https://financas-casal-default-rtdb.firebaseio.com`).

> Se você me passar esses valores aqui no chat, eu colo pra você e já
> subo pro site.

### 5. Trancar o acesso (importante)
1. Volte em **Realtime Database › aba "Regras"** e substitua por:

```json
{
  "rules": {
    "financas": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

2. Clique em **"Publicar"**. Assim só quem abre o **seu** app (que faz o
   login anônimo automático) consegue ler/escrever.

## Pronto
Abra `https://brucristinadesign.github.io/financas.html` nos dois celulares
(dá pra "Adicionar à tela inicial" e usar como app). Um lançamento feito
num aparelho aparece no outro em segundos. O selo no topo mostra
**"sincronizado"** quando está tudo conectado.

## Observações
- **Privacidade do PIN:** o PIN continua sendo a trava visual — cada um só
  vê a própria área ao abrir o app. Os dados individuais ficam no seu
  projeto Firebase, protegidos pelo login anônimo (passo 5), mas não são
  criptografados um contra o outro. Para um casal, é o equilíbrio certo
  entre simplicidade e privacidade. (Se um dia quiserem login com senha
  separando tecnicamente os dados, dá pra evoluir.)
- **Custo:** o plano gratuito (Spark) do Firebase é de sobra para o uso de
  vocês dois.
- **Sem configurar:** enquanto o `firebase-config.js` estiver vazio, o app
  roda normalmente, só que os dados ficam guardados apenas naquele
  aparelho (selo "só neste aparelho").
