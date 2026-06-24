import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { PlaceOrderRequest, PlaceOrderResponse } from '../types.js';
import { PCB_DEFAULTS } from './common.js';

export const PlaceOrderInputSchema = z.object({
  PcbFileName: z.string().min(1).describe('PCB file name (required)'),
  BuildDays: z.number().int().positive().describe('Production cycle in days (from quote response)'),
  BoardType: z.string().default('Single PCB').describe('"Single PCB", "Panel PCB as design", or "Panel PCB by Supplier"'),
  DesignInPanel: z.number().int().default(1).describe('Design in panel: 1-6'),
  Length: z.number().positive().describe('Board length in mm'),
  Width: z.number().positive().describe('Board width in mm'),
  Qty: z.number().int().positive().describe('Quantity'),
  Layers: z.number().int().min(1).max(14).describe('Number of layers'),
  Material: z.string().default('FR-4').describe('PCB material'),
  FR4Tg: z.string().default('TG150').describe('FR4 Tg grade'),
  Thickness: z.number().default(1.6).describe('Board thickness in mm'),
  MinTrackSpacing: z.string().default('6/6mil').describe('Min track/space'),
  MinHoleSize: z.number().default(0.3).describe('Min hole size in mm'),
  SolderMask: z.string().default('Green').describe('Solder mask color'),
  Silkscreen: z.string().default('White').describe('Silkscreen color'),
  SilkSides: z.number().int().default(0).describe('Silkscreen sides (0,2,3,4)'),
  Goldfingers: z.string().default('No').describe('Gold fingers: Yes or No'),
  SurfaceFinish: z.string().default('HASL with lead').describe('Surface finish'),
  ViaProcess: z.string().default('Tenting vias').describe('Via process'),
  FinishedCopper: z.string().default('1 oz Cu').describe('Finished copper weight'),
  RemoveProductNo: z.string().default('No').describe('Remove product number'),
  // Optional fields
  PcbFileUrl: z.string().optional().describe('URL to PCB file (alternative to DataZipFile)'),
  DataZipFile: z.string().optional().describe('Base64 encoded zip of PCB files'),
  Note: z.string().optional().describe('Order notes'),
  BuyerEmail: z.string().email().optional().describe('Buyer email for contact'),
  PONumber: z.string().optional().describe('Purchase order number'),
});

export type PlaceOrderInput = z.infer<typeof PlaceOrderInputSchema>;

export class PlaceOrder {
  static inputSchema = PlaceOrderInputSchema;

  constructor(private client: PcbWayClient) {}

  async place(params: PlaceOrderInput): Promise<string> {
    const body: PlaceOrderRequest = {
      PcbFileName: params.PcbFileName,
      BuildDays: params.BuildDays,
      BoardType: params.BoardType,
      DesignInPanel: params.DesignInPanel,
      Length: params.Length,
      Width: params.Width,
      Qty: params.Qty,
      Layers: params.Layers,
      Material: params.Material,
      FR4Tg: params.FR4Tg,
      Thickness: params.Thickness,
      MinTrackSpacing: params.MinTrackSpacing,
      MinHoleSize: params.MinHoleSize,
      SolderMask: params.SolderMask,
      Silkscreen: params.Silkscreen,
      SilkSides: params.SilkSides,
      Goldfingers: params.Goldfingers,
      SurfaceFinish: params.SurfaceFinish,
      ViaProcess: params.ViaProcess,
      FinishedCopper: params.FinishedCopper,
      RemoveProductNo: params.RemoveProductNo,
      ...PCB_DEFAULTS,
      // Override specific fields
      PcbFileUrl: params.PcbFileUrl ?? null,
      DataZipFile: params.DataZipFile ?? null,
      Note: params.Note ?? null,
      BuyerEmail: params.BuyerEmail ?? null,
      PONumber: params.PONumber ?? null,
      CopperLayer: '--',
      CopperSolderMask: '--',
      CopperSilkscreen: '--',
      RouteProcess: '--',
      EdgeRails: null,
      Rogers: null,
      TCE: null,
      ECopperPCB: null,
      EResistorPCB: null,
      CavityPCB: null,
      SemiFlexPCB: null,
      BackplanePCB: null,
    } as PlaceOrderRequest;

    const res = await this.client.request<PlaceOrderResponse>(
      '/api/Pcb/PlaceOrder',
      body as unknown as Record<string, unknown>,
    );

    return [
      '## Order Placed Successfully\n',
      `**Order Number:** ${res.OrderNo}`,
      `**Price:** $${res.Price.toFixed(2)}`,
      `**Delivery Date:** ${new Date(res.DeliveryDate).toLocaleString()}`,
    ].join('\n');
  }
}
