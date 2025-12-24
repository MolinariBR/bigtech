export async function listTenants() {
  const res = await fetch('http://localhost:8080/api/admin/tenants', {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`listTenants failed: ${res.status}`);
  const body = await res.json();
  return body.tenants || body.data || [];
}