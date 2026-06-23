import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { PcbQuotationRequest, PcbQuotationResponse } from '../types.js';
import { PCB_DEFAULTS } from './common.js';

export const PcbQuoteInputSchema = z.object({
  Country: z.string().describe('Country name (e.g. "UNITED STATES OF AMERICA")'),
  CountryCode: z.string().describe('Country code (e.g. "US")'),
  ShipType: z.number().int().describe('Logistics company (1=DHL, 10=FedEx IP, 4=SF Express, etc.)'),
  Postalcode: z.string().describe('Postal code'),
  City: z.string().describe('City'),
  BoardType: z.string().default('Single PCB').describe('"Single PCB", "Panel PCB as design", or "Panel PCB by Supplier"'),
  DesignInPanel: z.number().int().default(1).describe('Design in panel: 1-6'),
  Length: z.number().positive().describe('Board length in mm'),
  Width: z.number().positive().describe('Board width in mm'),
  Qty: z.number().int().positive().describe('Quantity (5-10000)'),
  Layers: z.number().int().min(1).max(14).describe('Number of layers (1,2,4,6,8,10,12,14)'),
  Material: z.string().default('FR-4').describe('PCB material: FR-4, Aluminum board, Rogers, HDI, Copper'),
  FR4Tg: z.string().default('TG150').describe('FR4 Tg grade: TG130, TG150, TG170, S1000H TG150, S1000-2M TG170'),
  Thickness: z.number().default(1.6).describe('Board thickness in mm'),
  MinTrackSpacing: z.string().default('6/6mil').describe('Min track/space: 3/3mil, 4/4mil, 5/5mil, 6/6mil, 8/8mil'),
  MinHoleSize: z.number().default(0.3).describe('Min hole size in mm'),
  SolderMask: z.string().default('Green').describe('Solder mask color'),
  Silkscreen: z.string().default('White').describe('Silkscreen color'),
  SilkSides: z.number().int().default(0).describe('Silkscreen sides (0,2,3,4)'),
  Goldfingers: z.string().default('No').describe('Gold fingers: Yes or No'),
  SurfaceFinish: z.string().default('HASL with lead').describe('Surface finish'),
  ViaProcess: z.string().default('Tenting vias').describe('Via process: Tenting vias, Plugged vias, Vias not covered'),
  FinishedCopper: z.string().default('1 oz Cu').describe('Finished copper weight'),
  RemoveProductNo: z.string().default('No').describe('Remove product number: No, Yes, Specify a location'),
  Note: z.string().optional().describe('Other special requests'),
  // Optional advanced fields
  EdgeRails: z.string().optional(),
  RouteProcess: z.string().optional(),
  InsideThickness: z.string().optional(),
  Rogers: z.string().optional(),
  TCE: z.string().optional(),
  CopperLayer: z.string().optional(),
  CopperSolderMask: z.string().optional(),
  CopperSilkscreen: z.string().optional(),
  GoldFingersBevelling: z.string().optional(),
  GoldPlatingType: z.string().optional(),
  GoldThickness: z.string().optional(),
  ImpedanceControl: z.string().optional(),
  PlatedHalfHole: z.string().optional(),
  PeelableSoldermask: z.string().optional(),
  ECopperPCB: z.string().optional(),
  EResistorPCB: z.string().optional(),
  CavityPCB: z.string().optional(),
  SemiFlexPCB: z.string().optional(),
  BackplanePCB: z.string().optional(),
  HoleCopperThickness: z.string().optional(),
  ULMaker: z.string().optional(),
  PackageBox: z.string().optional(),
  SidePlating: z.string().optional(),
  CarbonMask: z.string().optional(),
  CustomStackup: z.string().optional(),
  Countersink: z.string().optional(),
  HalogenFree: z.string().optional(),
});

export type PcbQuoteInput = z.infer<typeof PcbQuoteInputSchema>;

export class PcbQuote {
  static inputSchema = PcbQuoteInputSchema;

  constructor(private client: PcbWayClient) {}

  async getQuote(params: PcbQuoteInput): Promise<string> {
    const body: PcbQuotationRequest = {
      ...params,
      ...PCB_DEFAULTS,
      // Override specific fields that differ from defaults
      Note: params.Note ?? null,
      EdgeRails: params.EdgeRails ?? 'Yes',
      RouteProcess: params.RouteProcess ?? '--',
      CopperLayer: params.CopperLayer ?? '--',
      CopperSolderMask: params.CopperSolderMask ?? '--',
      CopperSilkscreen: params.CopperSilkscreen ?? '--',
      InsideThickness: params.InsideThickness ?? null,
      Rogers: params.Rogers ?? null,
      TCE: params.TCE ?? null,
      PlatedHalfHole: params.PlatedHalfHole ?? null,
      PeelableSoldermask: params.PeelableSoldermask ?? 'None',
      ImpedanceControl: params.ImpedanceControl ?? null,
      ECopperPCB: params.ECopperPCB ?? null,
      EResistorPCB: params.EResistorPCB ?? null,
      CavityPCB: params.CavityPCB ?? null,
      SemiFlexPCB: params.SemiFlexPCB ?? null,
      BackplanePCB: params.BackplanePCB ?? null,
      HoleCopperThickness: params.HoleCopperThickness ?? 'None',
      ULMaker: params.ULMaker ?? 'None',
      PackageBox: params.PackageBox ?? 'No',
      SidePlating: params.SidePlating ?? null,
      CarbonMask: params.CarbonMask ?? null,
      CustomStackup: params.CustomStackup ?? null,
      Countersink: params.Countersink ?? null,
      HalogenFree: params.HalogenFree ?? null,
    } as PcbQuotationRequest;

    const res = await this.client.request<PcbQuotationResponse>(
      '/api/Pcb/PcbQuotation',
      body as unknown as Record<string, unknown>,
    );

    const lines: string[] = ['## PCB Quotation Results\n'];
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
