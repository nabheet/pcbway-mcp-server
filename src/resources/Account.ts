import { z } from 'zod';
import type { PcbWayClient } from '../client.js';
import type { QueryBalanceResponse } from '../types.js';

/**
 * QueryBalance takes no parameters — empty body.
 */
export const AccountBalanceInputSchema = z.object({});

export type AccountBalanceInput = z.infer<typeof AccountBalanceInputSchema>;

export class Account {
  static inputSchema = AccountBalanceInputSchema;

  constructor(private client: PcbWayClient) {}

  async getBalance(_params: AccountBalanceInput): Promise<string> {
    const res = await this.client.request<QueryBalanceResponse>(
      '/api/Account/QueryBalance',
      {},
    );

    return [
      '## PCBWay Account Balance\n',
      `**Cash Balance:** $${res.balance.toFixed(2)}`,
      `**Coupon:** $${res.coupon.toFixed(2)}`,
      `**Points:** ${res.point}`,
    ].join('\n');
  }
}
