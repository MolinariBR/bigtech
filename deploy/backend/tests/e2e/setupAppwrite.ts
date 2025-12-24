export async function waitForAppwrite(options: { endpoint?: string; timeoutMs?: number } = {}) {
  let endpoint = (options.endpoint || process.env.APPWRITE_ENDPOINT || 'http://localhost').replace(/\/$/, '');
  // normalize: if endpoint contains a trailing /v1, strip it to form the base URL
  const base = endpoint.replace(/\/v1\/?$/, '');
  const timeoutMs = options.timeoutMs || 60_000;
  const start = Date.now();

  const healthUrls = [
    `${base}/v1/health`,
    `${base}/health`,
    `${base}/v1`,
    base
  ];

  // Use global fetch if available (Node 18+), otherwise use native http/https
  const nativeGet = (urlStr: string) =>
    new Promise<{ ok: boolean }>((resolve) => {
      try {
        const url = new URL(urlStr);
        const lib = url.protocol === 'https:' ? require('https') : require('http');
        const req = lib.request(
          {
            method: 'GET',
            hostname: url.hostname,
            port: url.port,
            path: `${url.pathname}${url.search}`,
            timeout: 3000
          },
          (res: any) => {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 400 });
          }
        );
        req.on('error', () => resolve({ ok: false }));
        req.on('timeout', () => {
          req.destroy();
          resolve({ ok: false });
        });
        req.end();
      } catch (err) {
        resolve({ ok: false });
      }
    });

  while (Date.now() - start < timeoutMs) {
    for (const url of healthUrls) {
      try {
        let res: { ok: boolean } | undefined;
        if ((globalThis as any).fetch) {
          try {
            // @ts-ignore runtime
            const r = await (globalThis as any).fetch(url, { method: 'GET' });
            res = { ok: !!r && r.ok };
          } catch (_) {
            res = { ok: false };
          }
        } else {
          res = await nativeGet(url);
        }

        if (res && res.ok) return;
      } catch (err) {
        // ignore and retry
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(`Appwrite did not become ready within ${timeoutMs}ms (tried ${healthUrls.join(', ')})`);
}

export default waitForAppwrite;
