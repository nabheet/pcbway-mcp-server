import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { CancelTGroupOrderRequest, CancelTGroupOrderResponse } from '../types.js';

export const CancelTGroupOrderInputSchema = z.object({
  TGroupNo: z.string().min(1).describe('Awaiting-payment order package number to cancel'),
});

export type CancelTGroupOrderInput = z.infer<typeof CancelTGroupOrderInputSchema>;

export class CancelTGroupOrder {
  static inputSchema = CancelTGroupOrderInputSchema;

  constructor(private client: PcbWayClient) {}

  async cancel(params: CancelTGroupOrderInput): Promise<string> {
    const body: CancelTGroupOrderRequest = { TGroupNo: params.TGroupNo };

    const res = await this.client.request<CancelTGroupOrderResponse>(
      '/api/Pcb/CancelTGroupOrder',
      body as unknown as Record<string, unknown>,
    );

    return [
      '## Cancel Awaiting-Payment Package\n',
      `**Package:** ${res.TGroupNo}`,
      '**Status:** Cancelled successfully',
    ].join('\n');
  }
}
