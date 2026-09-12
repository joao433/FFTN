# Guia de Deploy: Hostinger & Supabase Edge Functions

Este guia detalha o passo a passo para hospedar o frontend no **Hostinger** e as funções de backend no **Supabase Edge Functions**, com integração total ao Stripe.

---

## 1. Configuração do Supabase (Edge Functions & Storage)

### Variáveis de Ambiente no Supabase
Acesse o painel do seu projeto no **Supabase** -> **Settings** -> **Edge Functions** (ou via CLI `supabase secrets set ...`) e adicione:

```env
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secreta
STRIPE_SECRET_KEY=sk_live_ou_sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_JWT_SECRET=chave-secreta-jwt-longa-minimo-32-caracteres
ADMIN_SETUP_SECRET=chave-secreta-para-criar-primeiro-admin
APP_URL=https://seu-dominio-na-hostinger.com
```

### Buckets de Storage
Certifique-se de que os seguintes buckets existam no **Supabase Storage**:
- `package-images` (Público, para imagens e mídias de pacotes e cardápio)
- `site-config` (Público ou Privado, para backup de configurações)

### Deploy das Edge Functions via Supabase CLI
No terminal da sua máquina local:

```bash
# 1. Login no Supabase CLI
npx supabase login

# 2. Vincular ao seu projeto Supabase
npx supabase link --project-ref <seu-project-ref>

# 3. Deploy de todas as Edge Functions
npx supabase functions deploy create-checkout-session --no-verify-jwt
npx supabase functions deploy create-party-checkout-session --no-verify-jwt
npx supabase functions deploy create-menu-checkout-session --no-verify-jwt
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy get-party-availability --no-verify-jwt
npx supabase functions deploy admin-login --no-verify-jwt
npx supabase functions deploy admin-create-first-user --no-verify-jwt
npx supabase functions deploy admin-list-tickets --no-verify-jwt
npx supabase functions deploy admin-update-ticket-status --no-verify-jwt
npx supabase functions deploy admin-list-party-bookings --no-verify-jwt
npx supabase functions deploy admin-update-party-booking-status --no-verify-jwt
npx supabase functions deploy admin-manage-party-payment-settings --no-verify-jwt
npx supabase functions deploy admin-list-menu-orders --no-verify-jwt
npx supabase functions deploy admin-update-menu-order-status --no-verify-jwt
npx supabase functions deploy admin-manage-ticket-packages --no-verify-jwt
npx supabase functions deploy admin-manage-party-packages --no-verify-jwt
npx supabase functions deploy admin-manage-menu --no-verify-jwt
npx supabase functions deploy admin-manage-site-settings --no-verify-jwt
npx supabase functions deploy upload-image --no-verify-jwt
npx supabase functions deploy upload-media --no-verify-jwt
```

> **Dica:** O parâmetro `--no-verify-jwt` é recomendado porque as funções administrativas já utilizam o `verifyAdminToken` nativo com o token JWT de administrador, e as funções públicas (checkout, disponibilidade) recebem requisições abertas dos clientes.

### Deploy Automático via GitHub Actions
O repositório já inclui a action `.github/workflows/deploy-supabase-functions.yml`. A cada `push` para a branch `main` que modifique arquivos na pasta `supabase/**`, as funções são publicadas automaticamente.

Para ativar:
1. No seu repositório no GitHub, vá em **Settings** -> **Secrets and variables** -> **Actions**.
2. Adicione os seguintes Repository Secrets:
   - `SUPABASE_ACCESS_TOKEN`: Token de acesso pessoal gerado em [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
   - `SUPABASE_PROJECT_REF`: ID de referência do seu projeto Supabase (encontrado em **Settings** -> **General** no painel do Supabase).

### Configuração do Webhook no Stripe
No painel do Stripe:
1. Vá em **Developers** -> **Webhooks** -> **Add endpoint**.
2. URL do endpoint: `https://<seu-projeto>.supabase.co/functions/v1/stripe-webhook`
3. Eventos para escutar: `checkout.session.completed`
4. Copie o **Signing secret** (`whsec_...`) e defina como segredo `STRIPE_WEBHOOK_SECRET` no Supabase.

---

## 2. Compilação e Deploy do Frontend no Hostinger

### Passo 1: Configurar Variáveis de Ambiente no Frontend
No arquivo `.env` (ou `.env.production`) antes do build:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key-publica>
VITE_API_BASE_URL=https://<seu-projeto>.supabase.co/functions/v1
```

### Passo 2: Gerar os Arquivos de Produção
Execute no terminal:

```bash
npm run build
```

Isso gerará a pasta `dist/` contendo:
- `index.html`
- Pasta `assets/` com JS/CSS otimizados
- Arquivo `.htaccess` (copiado automaticamente da pasta `public/`) com suporte a SPA e cache otimizado.

### Passo 3: Enviar para a Hostinger
1. Abra o **hPanel** da Hostinger.
2. Vá em **Gerenciador de Arquivos** (File Manager) do seu domínio.
3. Entre na pasta `public_html/`.
4. Faça upload de **todo o conteúdo de dentro da pasta `dist/`** diretamente para `public_html/`.
5. Verifique se o arquivo `.htaccess` está presente em `public_html/.htaccess`. Ele é responsável pelo roteamento SPA (garantindo que recarregar páginas como `/ingressos`, `/festas`, `/cardapio` ou `/admin` não cause erro 404).

---

## 3. Primeiro Acesso Administrativo
Para criar o primeiro usuário de administrador, envie uma requisição POST para a função `admin-create-first-user`:

```bash
curl -X POST "https://<seu-projeto>.supabase.co/functions/v1/admin-create-first-user" \
  -H "Content-Type: application/json" \
  -d '{
    "setup_secret": "seu-admin-setup-secret",
    "email": "admin@seudominio.com",
    "password": "sua-senha-segura-aqui"
  }'
```
Pronto! Em seguida você poderá fazer login normalmente em `/admin`.
