import fc from 'fast-check';
import { billingEngine } from '../src/core/billingEngine';

describe('Billing aggregations property-based', () => {
  test('sum aggregation equals sum of items', async () => {
    await fc.assert(
      fc.asyncProperty(
        // generate array of positive/negative amounts
        fc.array(fc.record({ amount: fc.float().filter((n) => Number.isFinite(n)) }), { minLength: 1, maxLength: 50 }),
        async (arr) => {
          // Create fake items in memory by mocking billingEngine.listBillings to return our arr
          const original = (billingEngine as any).listBillings;
          (billingEngine as any).listBillings = async () => ({ items: arr.map((a: any, i: number) => ({ $id: `t${i}`, amount: a.amount, createdAt: new Date().toISOString() })) });

          const agg = await billingEngine.aggregateBillings({ from: undefined, to: undefined, granularity: 'day' });
          // compute sum of all items
          const expectedSum = arr.reduce((s: number, x: any) => s + (Number(x.amount) || 0), 0);
          // series should contain aggregated sum equal to expectedSum
          const totalSum = agg.series.reduce((s: number, x: any) => s + (x.sum || 0), 0);

          // restore
          (billingEngine as any).listBillings = original;

          return Math.abs(totalSum - expectedSum) < 1e-6;
        }
      ),
      { numRuns: 20 }
    );
  }, 20000);

  test('aggregation is deterministic (idempotent)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({ amount: fc.float().filter((n) => Number.isFinite(n)) }), { minLength: 1, maxLength: 50 }),
        async (arr) => {
          const original = (billingEngine as any).listBillings;
          (billingEngine as any).listBillings = async () => ({ items: arr.map((a: any, i: number) => ({ $id: `t${i}`, amount: a.amount, createdAt: new Date().toISOString() })) });

          const a1 = await billingEngine.aggregateBillings({ granularity: 'day' });
          const a2 = await billingEngine.aggregateBillings({ granularity: 'day' });

          (billingEngine as any).listBillings = original;

          return JSON.stringify(a1) === JSON.stringify(a2);
        }
      ),
      { numRuns: 20 }
    );
  }, 20000);
});
