export async function listPlugins(tenantId?: string) {
  const url = tenantId ? `/api/admin/plugins?tenantId=${encodeURIComponent(tenantId)}` : '/api/admin/plugins';
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`listPlugins failed: ${res.status}`);
  const body = await res.json();
  return body.data || body.plugins || body || [];
}

export async function togglePluginForTenant(tenantId: string, pluginKey: string, action: 'enable' | 'disable') {
  const res = await fetch(`/api/admin/plugins/${encodeURIComponent(pluginKey)}/toggle?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(`togglePluginForTenant failed: ${res.status}`);
  return await res.json();
}

export async function configurePlugin(pluginKey: string, config: any, tenantId?: string) {
  const url = tenantId ? `/api/admin/plugins/${encodeURIComponent(pluginKey)}/config?tenantId=${encodeURIComponent(tenantId)}` : `/api/admin/plugins/${encodeURIComponent(pluginKey)}/config`;
  const res = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });
  if (!res.ok) throw new Error(`configurePlugin failed: ${res.status}`);
  return await res.json();
}

export async function installPlugin(payload: { name: string; type: string; version: string }, tenantId?: string) {
  const url = tenantId ? `/api/admin/plugins?tenantId=${encodeURIComponent(tenantId)}` : '/api/admin/plugins';
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`installPlugin failed: ${res.status}`);
  return await res.json();
}

export async function removePlugin(pluginKey: string, tenantId?: string) {
  const url = tenantId ? `/api/admin/plugins/${encodeURIComponent(pluginKey)}?tenantId=${encodeURIComponent(tenantId)}` : `/api/admin/plugins/${encodeURIComponent(pluginKey)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`removePlugin failed: ${res.status}`);
  return await res.json();
}
