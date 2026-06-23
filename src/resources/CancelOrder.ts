import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { CancelOrderRequest, CancelOrderResponse } from '../types.js';

export const CancelOrderInputSchema = z.object({
  OrderNo: z.string().min(1).describe('PCBWay order number to cancel (e.g. "W0002AS1")'),
});

export type CancelOrderInput = z.infer<typeof CancelOrderInputSchema>;

export class CancelOrder {
  static inputSchema = CancelOrderInputSchema;

  constructor(private client: PcbWayClient) {}

  async cancel(params: CancelOrderInput): Promise<string> {
    const body: CancelOrderRequest = { OrderNo: params.OrderNo };

    const res = await this.client.request<CancelOrderResponse>(
      '/api/Pcb/CancelOrder',
      body as unknown as Record<string, unknown>,
    );

    return [
      '## Cancel Order\n',
      `**Order:** ${res.OrderNo}`,
      '**Status:** Cancelled successfully',
    ].join('\n');
  }
}
