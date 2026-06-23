import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { ConfirmOrderRequest, ConfirmOrderResponse } from '../types.js';
import { PAY_TYPES } from '../enums.js';

export const ConfirmOrderInputSchema = z.object({
  OrderNo: z.string().min(1).describe('Order number(s) — comma-separated for multiple (e.g. "W00001AS1" or "W00001AS1,W00001AS2")'),
  PayType: z.number().int().describe('Payment method (1=AccountPay, 2=PCBWayWebPay)'),
  AddGroupNo: z.string().optional().describe('Order package number (when adding to existing package)'),
  ShipType: z.number().int().optional().describe('Logistics company (required unless adding to package)'),
  Country: z.string().optional().describe('Country name (required unless adding to package)'),
  CountryCode: z.string().optional().describe('Country code (required unless adding to package)'),
  State: z.string().optional().describe('State/Province/Region'),
  Postalcode: z.string().optional().describe('Postal code'),
  City: z.string().optional().describe('City (required unless adding to package)'),
  Addr: z.string().optional().describe('Delivery address (required unless adding to package)'),
  CompanyName: z.string().optional().describe('Company name'),
  ContactName: z.string().optional().describe('Contact person'),
  Tel: z.string().optional().describe('Phone number (required unless adding to package)'),
  BuyerEmail: z.string().optional().describe('Buyer email for contact'),
  Tax: z.string().optional().describe('Tax ID'),
});

export type ConfirmOrderInput = z.infer<typeof ConfirmOrderInputSchema>;

export class ConfirmOrder {
  static inputSchema = ConfirmOrderInputSchema;

  constructor(private client: PcbWayClient) {}

  async confirm(params: ConfirmOrderInput): Promise<string> {
    const body: ConfirmOrderRequest = {
      OrderNo: params.OrderNo,
      PayType: params.PayType,
      AddGroupNo: params.AddGroupNo ?? null,
      ShipType: params.ShipType ?? null,
      Country: params.Country ?? null,
      CountryCode: params.CountryCode ?? null,
      State: params.State ?? null,
      Postalcode: params.Postalcode ?? null,
      City: params.City ?? null,
      Addr: params.Addr ?? null,
      CompanyName: params.CompanyName ?? null,
      ContactName: params.ContactName ?? null,
      Tel: params.Tel ?? null,
      BuyerEmail: params.BuyerEmail ?? null,
      Tax: params.Tax ?? null,
    };

    const res = await this.client.request<ConfirmOrderResponse>(
      '/api/Pcb/ConfirmOrder',
      body as unknown as Record<string, unknown>,
    );

    const payTypeName =
      Object.entries(PAY_TYPES).find(([, v]) => v === res.PayType)?.[0] ?? `Type ${res.PayType}`;

    const lines: string[] = [
      '## Confirm Order / Payment\n',
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
