import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ABSOLUTE TOP: Fast-path for the installer script
  app.get('/install-apt', (req, res) => {
    const scriptPath = path.join(process.cwd(), 'public', 'apt-installer.ps1');
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    try {
      if (fs.existsSync(scriptPath)) {
        return res.send(fs.readFileSync(scriptPath, 'utf8'));
      }
    } catch (e) {
      console.error('Script read failure:', e);
    }
    
    return res.status(404).send('Write-Error "Script file missing on server."');
  });

  app.get('/api/health', (req, res) => res.send('ok'));
  app.get('/api/origin', (req, res) => {
    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
    const proto = req.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    res.json({ origin: `${proto}://${host}` });
  });
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
