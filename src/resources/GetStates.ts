import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { GetStateRequest, GetStateResponse } from '../types.js';

export const GetStatesInputSchema = z.object({
  Country: z.string().min(1).describe('Country name (e.g. "UNITED STATES OF AMERICA")'),
  CountryCode: z.string().min(1).describe('Country code (e.g. "US")'),
});

export type GetStatesInput = z.infer<typeof GetStatesInputSchema>;

export class GetStates {
  static inputSchema = GetStatesInputSchema;

  constructor(private client: PcbWayClient) {}

  async get(params: GetStatesInput): Promise<string> {
    const body: GetStateRequest = {
      Country: params.Country,
      CountryCode: params.CountryCode,
    };

    const res = await this.client.request<GetStateResponse>(
      '/api/Address/GetState',
      body as unknown as Record<string, unknown>,
    );

    if (!res.States || res.States.length === 0) {
      return `No states/provinces found for ${params.Country}`;
    }

    const lines: string[] = [
      `## States/Provinces — ${params.Country}\n`,
    ];
    for (const s of res.States) {
      lines.push(`- ${s}`);
    }
    lines.push(`\n*${res.States.length} regions total*`);

    return lines.join('\n');
  }
}
