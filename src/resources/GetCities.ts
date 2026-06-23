import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { GetCityRequest, GetCityResponse } from '../types.js';

export const GetCitiesInputSchema = z.object({
  Country: z.string().min(1).describe('Country name (e.g. "UNITED STATES OF AMERICA")'),
  CountryCode: z.string().min(1).describe('Country code (e.g. "US")'),
  State: z.string().optional().describe('State/Province/Region to filter by'),
});

export type GetCitiesInput = z.infer<typeof GetCitiesInputSchema>;

export class GetCities {
  static inputSchema = GetCitiesInputSchema;

  constructor(private client: PcbWayClient) {}

  async get(params: GetCitiesInput): Promise<string> {
    const body: GetCityRequest = {
      Country: params.Country,
      CountryCode: params.CountryCode,
      State: params.State ?? null,
    };

    const res = await this.client.request<GetCityResponse>(
      '/api/Address/GetCity',
      body as unknown as Record<string, unknown>,
    );

    if (!res.Citys || res.Citys.length === 0) {
      return 'No cities found for the given region';
    }

    const lines: string[] = [
      '## Cities\n',
    ];
    for (const c of res.Citys) {
      lines.push(`- **${c.City}** (${c.Postalcode})`);
    }
    lines.push(`\n*${res.Citys.length} cities total*`);

    return lines.join('\n');
  }
}
