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

## 2. Deploy do Frontend no Hostinger

### Opção A: Deploy Automático via GitHub Actions (Recomendado)
O repositório possui o workflow `.github/workflows/deploy-frontend-hostinger.yml`. A cada push na branch `main` com alterações no frontend, ele instala dependências, compila o projeto com a regra do `.htaccess` e faz upload via FTP diretamente para `/public_html` na Hostinger.

#### 1. Configurar Secrets no GitHub:
Acesse no GitHub: **Settings** -> **Secrets and variables** -> **Actions** -> aba **Secrets**:
- `FTP_SERVER`: Endereço do host FTP da Hostinger (ex: `ftp.seudominio.com` ou o IP/hostname informado no hPanel).
- `FTP_USERNAME`: Usuário da conta FTP da Hostinger.
- `FTP_PASSWORD`: Senha da conta FTP da Hostinger.

#### 2. Configurar Variables no GitHub (Opcional / Recomendado):
Na mesma tela, na aba **Variables**:
- `VITE_API_BASE_URL`: `https://hyfdqwnuvcyxrnmqikfu.supabase.co/functions/v1` (o workflow já possui este valor configurado como fallback padrão caso não seja preenchido).
- `FTP_SERVER_DIR`: `public_html/` (padrão já configurado no workflow).

---

### Opção B: Build e Envio Manual via Gerenciador de Arquivos
Caso prefira compilar localmente na sua máquina:
1. Execute `npm run build` ou `bun run build`.
2. No hPanel da Hostinger, abra o **Gerenciador de Arquivos** na pasta `public_html/`.
3. Envie todo o conteúdo gerado dentro da pasta `dist/` (incluindo o arquivo `.htaccess`).

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
