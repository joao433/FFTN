import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function netlifyFunctionsPlugin(): Plugin {
  return {
    name: 'netlify-functions-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (
          req.url?.startsWith('/.netlify/functions/create-checkout-session') ||
          req.url?.startsWith('/.netlify/functions/create-party-checkout-session')
        ) {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          const isParty = req.url.startsWith('/.netlify/functions/create-party-checkout-session');

          req.on('end', async () => {
            try {
              const { handler } = isParty
                ? await import('./netlify/functions/create-party-checkout-session.js')
                : await import('./netlify/functions/create-checkout-session.js');
              const event = {
                httpMethod: 'POST',
                headers: req.headers,
                body,
                isBase64Encoded: false,
              };
              const result = await handler(event as any);
              res.statusCode = result.statusCode || 200;
              if (result.headers) {
                for (const [key, val] of Object.entries(result.headers)) {
                  res.setHeader(key, val as string);
                }
              }
              res.end(result.body);
            } catch (err: any) {
              console.error('[Vite Netlify Functions Dev Error]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error:
                    err?.message ||
                    'Erro ao criar sessão de checkout. Verifique as credenciais da Stripe e Supabase.',
                })
              );
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), netlifyFunctionsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
