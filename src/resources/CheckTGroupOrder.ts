import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { CheckTGroupOrderRequest, CheckTGroupOrderResponse } from '../types.js';

export const CheckTGroupOrderInputSchema = z.object({
  TGroupNo: z.string().min(1).describe('Awaiting-payment order package number (e.g. "G1278395")'),
});

export type CheckTGroupOrderInput = z.infer<typeof CheckTGroupOrderInputSchema>;

export class CheckTGroupOrder {
  static inputSchema = CheckTGroupOrderInputSchema;

  constructor(private client: PcbWayClient) {}

  async check(params: CheckTGroupOrderInput): Promise<string> {
    const body: CheckTGroupOrderRequest = { TGroupNo: params.TGroupNo };

    const res = await this.client.request<CheckTGroupOrderResponse>(
      '/api/Pcb/CheckTGroupOrder',
      body as unknown as Record<string, unknown>,
    );

    const tgo = res.TGroupOrder;
    const lines: string[] = [
      '## Awaiting-Payment Order Package\n',
      `**Package No:** ${tgo.TGroupNo}`,
      `**Created:** ${tgo.CreateTime}`,
      `**Total:** $${tgo.TotalMoney.toFixed(2)}`,
      `**Shipping:** $${tgo.ShipMoney.toFixed(2)}`,
      `**PayPal Fee:** $${tgo.FeePaypal.toFixed(2)}`,
      `**Ship Type:** ${tgo.ShipType}`,
      `**Country:** ${tgo.Country}`,
      `**City:** ${tgo.City}`,
      `**Address:** ${tgo.Addr}`,
      `**Contact:** ${tgo.ContactName}`,
      `**Tel:** ${tgo.Tel}`,
      `**Tax:** ${tgo.Tax}`,
    ];

    if (tgo.AddGroupNo) {
      lines.push(`**Add Package:** ${tgo.AddGroupNo}`);
    }

    const orders = res.OrderList;
    if (orders && orders.length > 0) {
      lines.push(`\n### Orders in Package (${orders.length})`);
      for (const o of orders) {
        lines.push(`\n- **Order:** ${o.GroupNo} | **Price:** $${o.Price.toFixed(2)} | **Status:** ${o.Status} | **Paid:** ${o.IsPaid}`);
      }
    }

    return lines.join('\n');
  }
}
