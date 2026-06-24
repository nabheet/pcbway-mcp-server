import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { GetFreightByOrderRequest, GetFreightByOrderResponse } from '../types.js';
import { SHIP_TYPES } from '../enums.js';

export const ShippingInputSchema = z.object({
  OrderNo: z.string().min(1).describe('PCBWay order number (or comma-separated for multiple)'),
  ShipType: z.number().int().describe('Logistics company (1=DHL, 10=FedEx IP, 4=SF Express, etc.)'),
  Country: z.string().describe('Country name'),
  CountryCode: z.string().describe('Country code (e.g. "US")'),
  Postalcode: z.string().describe('Postal code'),
  City: z.string().describe('City'),
  State: z.string().optional().describe('State/Province/Region'),
  AddGroupNo: z.string().optional().describe('Order package number (when adding to package)'),
});

export type ShippingInput = z.infer<typeof ShippingInputSchema>;

export class Shipping {
  static inputSchema = ShippingInputSchema;

  constructor(private client: PcbWayClient) {}

  async getFreight(params: ShippingInput): Promise<string> {
    const body: GetFreightByOrderRequest = {
      OrderNo: params.OrderNo,
      ShipType: params.ShipType,
      Country: params.Country,
      CountryCode: params.CountryCode,
      Postalcode: params.Postalcode,
      City: params.City,
      State: params.State ?? null,
      AddGroupNo: params.AddGroupNo ?? null,
    };

    const res = await this.client.request<GetFreightByOrderResponse>(
      '/api/Pcb/GetFreightByOrder',
      body as unknown as Record<string, unknown>,
    );

    // Reverse lookup ship type name
    const shipTypeName =
      Object.entries(SHIP_TYPES).find(([, v]) => v === params.ShipType)?.[0] ??
      `Type ${params.ShipType}`;

    const lines: string[] = [
      `## Freight Quote — Order ${params.OrderNo}\n`,
      `**Carrier:** ${shipTypeName}`,
      `**Shipping Cost:** $${res.Price.toFixed(2)}`,
      `**Estimated Delivery:** ${res.Days} days`,
      `**Weight:** Included in calculation`,
    ];

    if (res.IsRas) {
      lines.push('\n⚠️ **DHL Remote Area Surcharge** may apply to this address.');
    }

    return lines.join('\n');
  }
}
