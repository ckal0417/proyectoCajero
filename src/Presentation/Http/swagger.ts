import { readFileSync } from 'fs';
import path from 'path';
import type { Request, Response } from 'express';

export function serveSwaggerUi(req: Request, res: Response): void {
  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Banco Fuego API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
        });
      };
    </script>
  </body>
</html>`;
  res.type('html').send(html);
}

export function serveOpenApiSpec(req: Request, res: Response): void {
  const filePath = path.resolve(__dirname, '../../../openapi.json');
  const spec = readFileSync(filePath, 'utf8');
  res.type('json').send(spec);
}
