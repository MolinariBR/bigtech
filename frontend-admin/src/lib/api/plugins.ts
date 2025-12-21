export async function listPlugins(tenantId: string) {
  const res = await fetch(`/api/admin/plugins?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`listPlugins failed: ${res.status}`);
  const body = await res.json();
  // Expect body.data or body.plugins
  return body.data?.plugins || body.plugins || body.data || [];
}

export async function togglePlugin(pluginId: string, action: 'enable' | 'disable') {
  const res = await fetch(`/api/admin/plugins/${encodeURIComponent(pluginId)}/toggle`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(`togglePlugin failed: ${res.status}`);
  return await res.json();
}

export async function configurePlugin(pluginId: string, config: any) {
  const res = await fetch(`/api/admin/plugins/${encodeURIComponent(pluginId)}/config`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });
  if (!res.ok) throw new Error(`configurePlugin failed: ${res.status}`);
  return await res.json();
}

export async function installPlugin(tenantId: string, payload: { name: string; type: string; version: string }) {
  const res = await fetch(`/api/admin/plugins`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId, ...payload }),
  });
  if (!res.ok) throw new Error(`installPlugin failed: ${res.status}`);
  return await res.json();
}

export async function removePlugin(pluginId: string) {
  const res = await fetch(`/api/admin/plugins/${encodeURIComponent(pluginId)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`removePlugin failed: ${res.status}`);
  return await res.json();
}
