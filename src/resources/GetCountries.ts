import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { GetCountryResponse } from '../types.js';

/**
 * GetCountries takes no parameters — empty body.
 */
export const GetCountriesInputSchema = z.object({});

export type GetCountriesInput = z.infer<typeof GetCountriesInputSchema>;

export class GetCountries {
  static inputSchema = GetCountriesInputSchema;

  constructor(private client: PcbWayClient) {}

  async get(_params: GetCountriesInput): Promise<string> {
    const res = await this.client.request<GetCountryResponse>(
      '/api/Address/GetCountry',
      {},
    );

    const lines: string[] = ['## Supported Countries\n'];
    for (const c of res.Countrys) {
      lines.push(`- **${c.Country}** (${c.CountryCode})`);
    }
    lines.push(`\n*${res.Countrys.length} countries total*`);

    return lines.join('\n');
  }
}
