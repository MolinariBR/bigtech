// API functions for billing management
export interface BillingItem {
  $id: string;
  tenantId?: string;
  userId: string;
  type: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface BillingStats {
  totalRevenue: number;
  totalTransactions: number;
  pendingAmount: number;
  refundedAmount: number;
  monthlyRevenue: number;
}

export async function listBillingItems(page: number = 1, perPage: number = 20, filters?: any): Promise<{ items: BillingItem[]; total: number }> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
      ...filters
    });

    const response = await fetch(`/api/admin/billing?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch billing items');
    }
    const data = await response.json();
    return {
      items: data.items || [],
      total: data.total || 0
    };
  } catch (error) {
    console.error('Error fetching billing items:', error);
    throw error;
  }
}

export async function getBillingStats(): Promise<BillingStats> {
  try {
    const response = await fetch('/api/admin/billing/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch billing stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    throw error;
  }
}

export async function exportBillingData(): Promise<{ jobId: string }> {
  try {
    const response = await fetch('/api/admin/billing/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      throw new Error('Failed to export billing data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error exporting billing data:', error);
    throw error;
  }
}

export async function refundBillingItem(id: string, reason: string): Promise<{ refundId: string }> {
  try {
    const auditId = `audit_${Date.now()}`;
    const response = await fetch(`/api/admin/billing/${id}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Audit-Id': auditId
      },
      body: JSON.stringify({ reason })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process refund');
    }
    return await response.json();
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}