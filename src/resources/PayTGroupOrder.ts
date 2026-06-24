import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { PayTGroupOrderRequest, PayTGroupOrderResponse } from '../types.js';
import { PAY_TYPES } from '../enums.js';

export const PayTGroupOrderInputSchema = z.object({
  TGroupNo: z.string().min(1).describe('Awaiting-payment order package number'),
  PayType: z.number().int().describe('Payment method (1=AccountPay, 2=PCBWayWebPay)'),
});

export type PayTGroupOrderInput = z.infer<typeof PayTGroupOrderInputSchema>;

export class PayTGroupOrder {
  static inputSchema = PayTGroupOrderInputSchema;

  constructor(private client: PcbWayClient) {}

  async pay(params: PayTGroupOrderInput): Promise<string> {
    const body: PayTGroupOrderRequest = {
      TGroupNo: params.TGroupNo,
      PayType: params.PayType,
    };

    const res = await this.client.request<PayTGroupOrderResponse>(
      '/api/Pcb/PayTGroupOrder',
      body as unknown as Record<string, unknown>,
    );

    const payTypeName =
      Object.entries(PAY_TYPES).find(([, v]) => v === res.PayType)?.[0] ?? `Type ${res.PayType}`;

    const lines: string[] = [
      '## Pay Awaiting-Payment Package\n',
      `**Total Amount:** $${res.TotalAmount.toFixed(2)}`,
      `**Account Balance:** $${res.AccountBalance.toFixed(2)}`,
      `**Payment Method:** ${payTypeName}`,
    ];

    if (res.DeliveryDate) {
      lines.push(`**Delivery Date:** ${res.DeliveryDate}`);
    }
    if (res.GroupNo) {
      lines.push(`**Order Package:** ${res.GroupNo}`);
    }
    if (res.TGroupNo) {
      lines.push(`**Awaiting Payment Package:** ${res.TGroupNo}`);
    }
    if (res.PCBWayPayUrl) {
      lines.push(`**Payment URL:** ${res.PCBWayPayUrl}`);
    }

    return lines.join('\n');
  }
}
