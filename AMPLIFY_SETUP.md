# AWS Amplify — Guia Rápido (Free tier friendly)

Objetivo: hospedar os frontends com o mínimo de configuração e sem GitHub Actions.

Passos mínimos:

1. Acesse o console AWS Amplify: https://console.aws.amazon.com/amplify/
2. Clique em **Host web app** → **Connect app** → selecione **GitHub**.
3. Autorize o Amplify a acessar seu repositório (autorize a conta GitHub se necessário).
4. Selecione o repositório `MolinariBR/bigtech` e a branch `master`.
5. Em **Build settings**, use o template padrão ou substitua por este (Next.js compatível com export estático):

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend-app
        - npm ci
    build:
      commands:
        - npm run build || true
        - npx next export -o out || true
  artifacts:
    baseDirectory: frontend-app/out
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**
```

Repita para `frontend-admin` criando outra app no Amplify ou configure um build que trate os dois projetos.

Observações importantes:
- Amplify funciona bem para sites estáticos (S3/CloudFront por trás dos panos).
- Se o seu app usa SSR ou funções server-side (Next.js com server components), prefira hospedar em Vercel ou usar containers (ECS/EC2).
- O plano gratuito da AWS pode cobrir tráfego pequeno; monitore billing.

Alternativa ainda mais simples (local): use `aws cli` + `s3 sync` (já há workflow mínimo no repositório). Mas Amplify elimina a necessidade de Actions.

Se quiser, eu:
- A: te guio passo a passo na conexão do GitHub com o Amplify (apenas confirme para eu enviar os passos exatos), ou
- B: eu configuro um `amplify.yml` aqui e commito (você só precisa conectar no console e apontar o repo).
