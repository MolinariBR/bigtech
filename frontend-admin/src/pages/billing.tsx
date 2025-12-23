import React from 'react';

// Página de monitoramento de billing (TASK-014)
export default function BillingPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    fetchList();
  }, [page]);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/billing?page=${page}&perPage=20`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    const res = await fetch('/api/admin/billing/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const data = await res.json();
    alert(`Export job submitted: ${data.jobId}`);
  }

  async function handleRefund(id: string) {
    const auditId = `audit_${Date.now()}`;
    const res = await fetch(`/api/admin/billing/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Audit-Id': auditId },
      body: JSON.stringify({ reason: 'Admin refund' })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Refund created: ' + data.refundId);
      fetchList();
    } else {
      alert('Refund failed: ' + (data.error || 'unknown'));
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Monitoramento de Billing</h1>
      <div className="mb-4">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded" onClick={handleExport} disabled={loading}>
          Exportar
        </button>
      </div>
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant</th>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any) => (
              <tr key={it.$id}>
                <td>{it.$id}</td>
                <td>{it.tenantId}</td>
                <td>{it.userId}</td>
                <td>{it.type}</td>
                <td>{it.amount}</td>
                <td>{it.status}</td>
                <td>
                  <button className="px-2 py-1 bg-error text-error-foreground rounded" onClick={() => handleRefund(it.$id)}>
                    Reembolsar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-4">
        <button className="px-3 py-1 mr-2 bg-secondary text-secondary-foreground" onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Anterior
        </button>
        <button className="px-3 py-1 bg-secondary text-secondary-foreground" onClick={() => setPage((p) => p + 1)}>
          Próxima
        </button>
      </div>
    </div>
  );
}