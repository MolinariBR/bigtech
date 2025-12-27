// API functions for audit management
export interface AuditLog {
  $id: string;
  tenantId?: string;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress: string;
  timestamp: string;
  createdAt: string;
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  criticalActions: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
}

export async function listAuditLogs(
  page: number = 1,
  perPage: number = 20,
  filters?: {
    tenantId?: string;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }
): Promise<{ items: AuditLog[]; total: number }> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
      ...filters
    });

    const response = await fetch(`/api/admin/audit?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }
    const data = await response.json();
    return {
      items: data.items || [],
      total: data.total || 0
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

export async function getAuditStats(): Promise<AuditStats> {
  try {
    const response = await fetch('/api/admin/audit/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch audit stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    throw error;
  }
}

export async function exportAuditLogs(filters?: Record<string, unknown>): Promise<{ jobId: string }> {
  try {
    const response = await fetch('/api/admin/audit/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters || {})
    });
    if (!response.ok) {
      throw new Error('Failed to export audit logs');
    }
    return await response.json();
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    throw error;
  }
}