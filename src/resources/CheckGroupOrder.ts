import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { CheckGroupOrderRequest, CheckGroupOrderResponse } from '../types.js';

export const CheckGroupOrderInputSchema = z.object({
  GroupNo: z.string().min(1).describe('Order package number (e.g. "G378138")'),
});

export type CheckGroupOrderInput = z.infer<typeof CheckGroupOrderInputSchema>;

export class CheckGroupOrder {
  static inputSchema = CheckGroupOrderInputSchema;

  constructor(private client: PcbWayClient) {}

  async check(params: CheckGroupOrderInput): Promise<string> {
    const body: CheckGroupOrderRequest = { GroupNo: params.GroupNo };

    const res = await this.client.request<CheckGroupOrderResponse>(
      '/api/Pcb/CheckGroupOrder',
      body as unknown as Record<string, unknown>,
    );

    const go = res.GroupOrder;
    const lines: string[] = [
      '## Order Package Details\n',
      `**Package No:** ${go.GroupNo}`,
      `**Created:** ${go.CreateTime}`,
      `**Total:** $${go.TotalMoney.toFixed(2)}`,
      `**Shipping:** $${go.ShipMoney.toFixed(2)}`,
      `**PayPal Fee:** $${go.FeePaypal.toFixed(2)}`,
      `**Ship Type:** ${go.ShipType}`,
      `**Country:** ${go.Country}`,
      `**City:** ${go.City}`,
      `**Address:** ${go.Addr}`,
      `**Contact:** ${go.ContactName}`,
      `**Tel:** ${go.Tel}`,
      `**Tax:** ${go.Tax}`,
    ];

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
