import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { QueryOrderProcessRequest, QueryOrderProcessResponse } from '../types.js';

export const OrderProcessInputSchema = z.object({
  OrderNo: z.string().min(1).describe('PCBWay order number (e.g. "W0002AS1")'),
});

export type OrderProcessInput = z.infer<typeof OrderProcessInputSchema>;

export class OrderProcess {
  static inputSchema = OrderProcessInputSchema;

  constructor(private client: PcbWayClient) {}

  async getStatus(params: OrderProcessInput): Promise<string> {
    const body: QueryOrderProcessRequest = {
      OrderNo: params.OrderNo,
    };

    const res = await this.client.request<QueryOrderProcessResponse>(
      '/api/Pcb/QueryOrderProcess',
      body as unknown as Record<string, unknown>,
    );

    const lines: string[] = [
      `## Order ${params.OrderNo} — Fabrication Status\n`,
      '### All Required Processes',
    ];

    for (const proc of res.AllProcess) {
      lines.push(`- ${proc}`);
    }

    lines.push('\n### Completed Steps');
    if (res.List.length === 0) {
      lines.push('No steps completed yet.');
    } else {
      for (const step of res.List) {
        const time = new Date(step.Time).toLocaleString();
        lines.push(`- ✅ **${step.Name}** — ${time}`);
      }
    }

    return lines.join('\n');
  }
}
