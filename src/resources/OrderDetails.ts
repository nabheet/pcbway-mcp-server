import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { CheckOrderDetailsRequest, CheckOrderDetailsResponse } from '../types.js';

export const OrderDetailsInputSchema = z.object({
  OrderNo: z.string().min(1).describe('PCBWay order number (e.g. "W0002AS1")'),
});

export type OrderDetailsInput = z.infer<typeof OrderDetailsInputSchema>;

export class OrderDetails {
  static inputSchema = OrderDetailsInputSchema;

  constructor(private client: PcbWayClient) {}

  async getDetails(params: OrderDetailsInput): Promise<string> {
    const body: CheckOrderDetailsRequest = {
      OrderNo: params.OrderNo,
    };

    const res = await this.client.request<CheckOrderDetailsResponse>(
      '/api/Pcb/CheckOrderDetails',
      body as unknown as Record<string, unknown>,
    );

    const pcb = res.PcbModel;
    const statusMap: Record<number, string> = {
      0: 'Unknown',
      1: 'Pending',
      2: 'Processing',
      3: 'Completed',
      4: 'On Hold',
      5: 'Cancelled',
    };

    const lines: string[] = [
      `## Order ${params.OrderNo} Details\n`,
      `**Status:** ${statusMap[pcb.Status] ?? pcb.Status} | **Paid:** ${pcb.IsPaid ? 'Yes' : 'No'}`,
      `**Price:** $${pcb.Price.toFixed(2)} | **Build Days:** ${pcb.BuildDays}`,
      `**Delivery Date:** ${new Date(pcb.DeliveryDate).toLocaleString()}`,
      `**Audit Result:** ${pcb.AuditResult}`,
      '',
      '### PCB Parameters',
      `Dimensions: ${pcb.Length}mm × ${pcb.Width}mm | Layers: ${pcb.Layers} | Qty: ${pcb.Qty}`,
      `Material: ${pcb.Material} | Thickness: ${pcb.Thickness}mm`,
      `Board Type: ${pcb.BoardType} | Design in Panel: ${pcb.DesignInPanel}`,
      `Min Track/Space: ${pcb.MinTrackSpacing} | Min Hole: ${pcb.MinHoleSize}mm`,
      `Solder Mask: ${pcb.SolderMask} | Silkscreen: ${pcb.Silkscreen}`,
      `Surface Finish: ${pcb.SurfaceFinish} | Copper: ${pcb.FinishedCopper}`,
      `Via Process: ${pcb.ViaProcess}`,
      pcb.FileUrl ? `\n**File:** [${pcb.FileName}](${pcb.FileUrl})` : '',
      pcb.Note ? `\n**Notes:** ${pcb.Note}` : '',
      pcb.GroupNo ? `\n**Group No:** ${pcb.GroupNo}` : '',
    ];

    return lines.filter(Boolean).join('\n');
  }
}
