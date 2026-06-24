import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { SmtQuotationRequest, SmtQuotationResponse } from '../types.js';

export const SmtQuoteInputSchema = z.object({
  Country: z.string().describe('Country name'),
  CountryCode: z.string().describe('Country code (e.g. "US")'),
  ShipType: z.number().int().describe('Logistics company (1=DHL, 10=FedEx IP, etc.)'),
  Postalcode: z.string().describe('Postal code'),
  City: z.string().describe('City'),
  FlexibleOption: z.enum(['Turnkey', 'Kitted or Consigned', 'Combo'])
    .describe('Assembly flexible option'),
  BoardType: z.enum(['Single pieces', 'Panelized PCBs'])
    .describe('Board type'),
  AssemblySide: z.enum(['Top side', 'Bottom side', 'Both sides'])
    .describe('Assembly side'),
  Qty: z.number().int().positive().describe('Quantity to assemble'),
  UniqueParts: z.number().int().min(0).default(0).describe('Number of unique parts'),
  SMTParts: z.number().int().min(0).default(0).describe('Number of SMT parts'),
  HoleParts: z.number().int().min(0).default(0).describe('Number of through-hole parts'),
});

export type SmtQuoteInput = z.infer<typeof SmtQuoteInputSchema>;

export class SmtQuote {
  static inputSchema = SmtQuoteInputSchema;

  constructor(private client: PcbWayClient) {}

  async getQuote(params: SmtQuoteInput): Promise<string> {
    const body: SmtQuotationRequest = {
      Country: params.Country,
      CountryCode: params.CountryCode,
      ShipType: params.ShipType,
      Postalcode: params.Postalcode,
      City: params.City,
      FlexibleOption: params.FlexibleOption,
      BoardType: params.BoardType,
      AssemblySide: params.AssemblySide,
      Qty: params.Qty,
      UniqueParts: params.UniqueParts,
      SMTParts: params.SMTParts,
      HoleParts: params.HoleParts,
    };

    const res = await this.client.request<SmtQuotationResponse>(
      '/api/SMT/SMTQuotation',
      body as unknown as Record<string, unknown>,
    );

    const lines: string[] = ['## SMT Assembly Quotation Results\n'];
    for (const item of res.priceList) {
      const type = item.Express ? '🚀 Express' : item.Standard ? '📦 Standard' : '⚡ Economy';
      lines.push(
        `**${type}** — $${item.Price.toFixed(2)} | Build: ${item.BuildDays} days (${item.BuildText})`,
      );
    }

    if (res.Shipping) {
      lines.push('');
      lines.push('### Shipping');
      lines.push(`Cost: $${res.Shipping.ShipCost.toFixed(2)} | Days: ${res.Shipping.ShipDays} | Weight: ${res.Shipping.Weight}g`);
      if (res.Shipping.IsRas) lines.push('⚠️ DHL Remote Area Surcharge may apply');
    }

    return lines.join('\n');
  }
}
