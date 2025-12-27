export async function listPlugins(): Promise<unknown[]> {
  const res = await fetch('http://localhost:8080/api/admin/plugins', {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`listPlugins failed: ${res.status}`);
  const body = await res.json();
  return body.data || body.plugins || body || [];
}

export async function togglePlugin(pluginKey: string, action: 'enable' | 'disable'): Promise<unknown> {
  const res = await fetch(`http://localhost:8080/api/admin/plugins/${encodeURIComponent(pluginKey)}/toggle`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(`togglePlugin failed: ${res.status}`);
  return await res.json();
}

export async function configurePlugin(pluginKey: string, config: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`http://localhost:8080/api/admin/plugins/${encodeURIComponent(pluginKey)}/config`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });
  if (!res.ok) throw new Error(`configurePlugin failed: ${res.status}`);
  return await res.json();
}

export async function installPlugin(payload: { name: string; type: string; version: string }): Promise<unknown> {
  const res = await fetch('http://localhost:8080/api/admin/plugins', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`installPlugin failed: ${res.status}`);
  return await res.json();
}

export async function removePlugin(pluginKey: string): Promise<unknown> {
  const res = await fetch(`http://localhost:8080/api/admin/plugins/${encodeURIComponent(pluginKey)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`removePlugin failed: ${res.status}`);
  return await res.json();
}
