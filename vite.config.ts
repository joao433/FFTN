import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function netlifyFunctionsPlugin(): Plugin {
  return {
    name: 'netlify-functions-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const isNetlify = req.url?.startsWith('/.netlify/functions/');
        const isSupabase = req.url?.startsWith('/functions/v1/');
        if (isNetlify || isSupabase) {
          const urlObj = new URL(req.url, 'http://localhost:3000');
          const prefix = isNetlify ? '/.netlify/functions/' : '/functions/v1/';
          const funcName = urlObj.pathname.replace(prefix, '').split('/')[0];

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const mod = await import(`./netlify/functions/${funcName}.js`);
              const handler = mod.handler;
              if (!handler) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: `Função ${funcName} não encontrada.` }));
                return;
              }

              const queryStringParameters: Record<string, string> = {};
              urlObj.searchParams.forEach((val, key) => {
                queryStringParameters[key] = val;
              });

              const event = {
                httpMethod: req.method || 'GET',
                headers: req.headers,
                queryStringParameters,
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
              console.error(`[Vite Netlify Functions Dev Error - ${funcName}]:`, err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: err?.message || 'Erro interno ao processar a função.',
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
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
