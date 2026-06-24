import { describe, it, expect } from 'vitest';
import { PcbQuoteInputSchema } from '../resources/PcbQuote.js';
import { SmtQuoteInputSchema } from '../resources/SmtQuote.js';
import { OrderProcessInputSchema } from '../resources/OrderProcess.js';
import { OrderDetailsInputSchema } from '../resources/OrderDetails.js';
import { ShippingInputSchema } from '../resources/Shipping.js';
import { AccountBalanceInputSchema } from '../resources/Account.js';
import { PlaceOrderInputSchema } from '../resources/PlaceOrder.js';
import { ConfirmOrderInputSchema } from '../resources/ConfirmOrder.js';
import { CancelOrderInputSchema } from '../resources/CancelOrder.js';
import { CheckTGroupOrderInputSchema } from '../resources/CheckTGroupOrder.js';
import { PayTGroupOrderInputSchema } from '../resources/PayTGroupOrder.js';
import { CancelTGroupOrderInputSchema } from '../resources/CancelTGroupOrder.js';
import { CheckGroupOrderInputSchema } from '../resources/CheckGroupOrder.js';
import { GetCountriesInputSchema } from '../resources/GetCountries.js';
import { GetStatesInputSchema } from '../resources/GetStates.js';
import { GetCitiesInputSchema } from '../resources/GetCities.js';
import { SHIP_TYPES, PAY_TYPES } from '../enums.js';
import { PCB_DEFAULTS } from '../resources/common.js';

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Helper: assert schema parses successfully and defaults are applied.
 */
function assertParses<T>(schema: z.ZodType<T>, input: Record<string, unknown>): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(`Expected parse to succeed but got: ${JSON.stringify(result.error.issues)}`);
  }
  return result.data;
}

/**
 * Helper: assert schema rejects with a ZodError mentioning `field` or matching a predicate.
 */
function assertRejects(
  schema: z.ZodType<unknown>,
  input: unknown,
  fieldMatcher?: string | ((issues: z.ZodIssue[]) => boolean),
): void {
  const result = schema.safeParse(input);
  if (result.success) {
    throw new Error(`Expected parse to fail but got: ${JSON.stringify(result.data)}`);
  }
  if (typeof fieldMatcher === 'string') {
    const matched = result.error.issues.some(
      (i) => i.path.join('.') === fieldMatcher || i.message.includes(fieldMatcher),
    );
    if (!matched) {
      throw new Error(
        `Expected issue matching "${fieldMatcher}" but got: ${JSON.stringify(result.error.issues)}`,
      );
    }
  } else if (typeof fieldMatcher === 'function') {
    if (!fieldMatcher(result.error.issues)) {
      throw new Error(`Predicate returned false for issues: ${JSON.stringify(result.error.issues)}`);
    }
  }
}

// ── Default PCB params fixture ──────────────────────────────────

const PCB_REQUIRED = {
  Country: 'UNITED STATES OF AMERICA',
  CountryCode: 'US',
  ShipType: 1,
  Postalcode: '10001',
  City: 'New York',
  Length: 50,
  Width: 50,
  Qty: 10,
  Layers: 2,
} as const;

const PCB_ORDER_REQUIRED = {
  PcbFileName: 'my_board.zip',
  BuildDays: 5,
  Length: 50,
  Width: 50,
  Qty: 10,
  Layers: 2,
} as const;

const ADDRESS_REQUIRED = {
  Country: 'UNITED STATES OF AMERICA',
  CountryCode: 'US',
} as const;

// ── Enums ────────────────────────────────────────────────────────

describe('SHIP_TYPES', () => {
  it('has expected values', () => {
    expect(SHIP_TYPES.DHL).toBe(1);
    expect(SHIP_TYPES.FedEx_IP).toBe(10);
    expect(SHIP_TYPES.SF_Express).toBe(4);
    expect(SHIP_TYPES.EMS).toBe(6);
    expect(SHIP_TYPES.E_packet).toBe(7);
    expect(SHIP_TYPES.China_Post).toBe(9);
    expect(SHIP_TYPES.Global_Standard_Shipping).toBe(35);
    expect(SHIP_TYPES.Freight_Collect_Account).toBe(5);
    expect(SHIP_TYPES.FedExFICP).toBe(25);
  });
});

describe('PAY_TYPES', () => {
  it('has expected values', () => {
    expect(PAY_TYPES.AccountPay).toBe(1);
    expect(PAY_TYPES.PCBWayWebPay).toBe(2);
  });
});

// ── PCB_DEFAULTS ─────────────────────────────────────────────────

describe('PCB_DEFAULTS', () => {
  it('contains all expected keys', () => {
    expect(PCB_DEFAULTS.cxipt).toBeNull();
    expect(PCB_DEFAULTS.StructureMCPCB).toBe('middle');
    expect(PCB_DEFAULTS.DateCode).toBe('None');
    expect(PCB_DEFAULTS.PeelableSoldermask).toBe('None');
    expect(PCB_DEFAULTS.HoleCopperThickness).toBe('None');
    expect(PCB_DEFAULTS.ULMaker).toBe('None');
    expect(PCB_DEFAULTS.PackageBox).toBe('No');
    expect(PCB_DEFAULTS.RemoveProductNo).toBe('No');
    expect(PCB_DEFAULTS.AddSerialNumbers).toBe('None');
    expect(PCB_DEFAULTS.RouteProcess).toBe('--');
    expect(PCB_DEFAULTS.PinBanNum).toBe(0);
    expect(PCB_DEFAULTS.CopperLayer).toBe('--');
    expect(PCB_DEFAULTS.CopperSolderMask).toBe('--');
    expect(PCB_DEFAULTS.CopperSilkscreen).toBe('--');
    expect(PCB_DEFAULTS.ThermoelectricSeparation).toBe('');
    expect(PCB_DEFAULTS.Buriedblind).toBe('');
    expect(PCB_DEFAULTS.Viafilled).toBe('');
    expect(PCB_DEFAULTS.PaperBetweenPCBs).toBe('');
  });

  it('has null for all gold/plating fields', () => {
    const nullFields = [
      'cxipt', 'cxiptselectiveGold', 'cxiptselectiveHold', 'cxiptselectiveGoldHold',
      'XoutAllowance', 'EdgeRailsContent', 'GoldFingersBevelling', 'GoldPlatingType',
      'GoldThickness', 'GoldThicknessSelective', 'GoldFingerThickness', 'BoardThickness',
      'AUGoldThickness', 'NiGoldThickness', 'SendAUGoldThickness', 'SendNiGoldThickness',
      'SendPdAUGoldThickness', 'SendPdNiGoldThickness', 'SendPdPdGoldThickness',
      'AuHoldSelective', 'NiHoldSelective', 'GoldHoldSelective', 'AuGoldHoldSelective',
      'NiGoldHoldSelective', 'PdAUGoldThickness', 'PdNiGoldThickness', 'PdPdGoldThickness',
      'AllowENIG', 'DataCodeDes', 'ViaPadOrViaResin', 'ViaPadNew', 'WPHybridPCB',
      'LeadlessHardGold', 'BlackFR4blackcore', 'Pressfitholes', 'AcceptHASLUp', 'Zaxis',
    ];
    for (const key of nullFields) {
      expect(PCB_DEFAULTS[key]).toBeNull();
    }
  });
});

// ── PCB Quote ────────────────────────────────────────────────────

describe('PcbQuoteInputSchema', () => {
  it('parses valid minimal input with defaults', () => {
    const data = assertParses(PcbQuoteInputSchema, { ...PCB_REQUIRED });
    expect(data.Country).toBe('UNITED STATES OF AMERICA');
    expect(data.BoardType).toBe('Single PCB');
    expect(data.Material).toBe('FR-4');
    expect(data.Thickness).toBe(1.6);
    expect(data.SolderMask).toBe('Green');
    expect(data.Silkscreen).toBe('White');
    expect(data.SurfaceFinish).toBe('HASL with lead');
    expect(data.ViaProcess).toBe('Tenting vias');
    expect(data.FinishedCopper).toBe('1 oz Cu');
    expect(data.Layers).toBe(2);
  });

  it('rejects missing required fields', () => {
    assertRejects(PcbQuoteInputSchema, {}, 'Country');
    assertRejects(PcbQuoteInputSchema, { Country: 'US' }, 'CountryCode');
    assertRejects(PcbQuoteInputSchema, { ...PCB_REQUIRED, Length: undefined }, 'Length');
  });

  it('rejects wrong types', () => {
    assertRejects(PcbQuoteInputSchema, { ...PCB_REQUIRED, Length: 'fifty' }, 'Length');
    assertRejects(PcbQuoteInputSchema, { ...PCB_REQUIRED, Qty: -1 }, 'Qty');
  });

  it('accepts all optional advanced fields', () => {
    const data = assertParses(PcbQuoteInputSchema, {
      ...PCB_REQUIRED,
      EdgeRails: 'Yes',
      Rogers: 'Rogers 4350B',
      ImpedanceControl: 'Yes',
      ECopperPCB: 'Yes',
    });
    expect(data.EdgeRails).toBe('Yes');
    expect(data.Rogers).toBe('Rogers 4350B');
    expect(data.ImpedanceControl).toBe('Yes');
    expect(data.ECopperPCB).toBe('Yes');
  });
});

// ── SMT Quote ────────────────────────────────────────────────────

describe('SmtQuoteInputSchema', () => {
  const SMT_MIN = { ...PCB_REQUIRED, FlexibleOption: 'Turnkey', BoardType: 'Single pieces', AssemblySide: 'Top side', Qty: 100 };

  it('parses valid minimal input', () => {
    const data = assertParses(SmtQuoteInputSchema, SMT_MIN);
    expect(data.FlexibleOption).toBe('Turnkey');
    expect(data.UniqueParts).toBe(0);
    expect(data.SMTParts).toBe(0);
    expect(data.HoleParts).toBe(0);
  });

  it('rejects missing required fields', () => {
    assertRejects(SmtQuoteInputSchema, PCB_REQUIRED, 'FlexibleOption');
    assertRejects(SmtQuoteInputSchema, { ...SMT_MIN, FlexibleOption: undefined }, 'FlexibleOption');
  });

  it('enforces enum values', () => {
    assertRejects(SmtQuoteInputSchema, { ...SMT_MIN, FlexibleOption: 'Invalid' });
    assertRejects(SmtQuoteInputSchema, { ...SMT_MIN, BoardType: 'Invalid' });
    assertRejects(SmtQuoteInputSchema, { ...SMT_MIN, AssemblySide: 'Invalid' });
  });
});

// ── Order Process ────────────────────────────────────────────────

describe('OrderProcessInputSchema', () => {
  it('parses valid input', () => {
    const data = assertParses(OrderProcessInputSchema, { OrderNo: 'W0002AS1' });
    expect(data.OrderNo).toBe('W0002AS1');
  });

  it('rejects empty order number', () => {
    assertRejects(OrderProcessInputSchema, {}, 'OrderNo');
    assertRejects(OrderProcessInputSchema, { OrderNo: '' }, 'OrderNo');
  });
});

// ── Order Details ────────────────────────────────────────────────

describe('OrderDetailsInputSchema', () => {
  it('parses valid input', () => {
    const data = assertParses(OrderDetailsInputSchema, { OrderNo: 'W0002AS1' });
    expect(data.OrderNo).toBe('W0002AS1');
  });

  it('rejects missing OrderNo', () => {
    assertRejects(OrderDetailsInputSchema, {}, 'OrderNo');
  });
});

// ── Shipping ─────────────────────────────────────────────────────

describe('ShippingInputSchema', () => {
  const SHIP_MIN = { OrderNo: 'W0002AS1', ShipType: 1, Country: 'US', CountryCode: 'US', Postalcode: '10001', City: 'NYC' };

  it('parses valid minimal input', () => {
    const data = assertParses(ShippingInputSchema, SHIP_MIN);
    expect(data.OrderNo).toBe('W0002AS1');
  });

  it('accepts optional fields', () => {
    const data = assertParses(ShippingInputSchema, { ...SHIP_MIN, State: 'NY', AddGroupNo: 'G123' });
    expect(data.State).toBe('NY');
    expect(data.AddGroupNo).toBe('G123');
  });

  it('rejects missing required fields', () => {
    assertRejects(ShippingInputSchema, {}, 'OrderNo');
    assertRejects(ShippingInputSchema, { OrderNo: 'W0002AS1' }, 'ShipType');
  });
});

// ── Account Balance ──────────────────────────────────────────────

describe('AccountBalanceInputSchema', () => {
  it('parses empty object', () => {
    const data = assertParses(AccountBalanceInputSchema, {});
    expect(data).toEqual({});
  });

  it('parses no input', () => {
    const data = assertParses(AccountBalanceInputSchema, {});
    expect(Object.keys(data)).toHaveLength(0);
  });
});

// ── Place Order ──────────────────────────────────────────────────

describe('PlaceOrderInputSchema', () => {
  it('parses valid minimal input with defaults', () => {
    const data = assertParses(PlaceOrderInputSchema, { ...PCB_ORDER_REQUIRED });
    expect(data.BoardType).toBe('Single PCB');
    expect(data.Material).toBe('FR-4');
    expect(data.Thickness).toBe(1.6);
    expect(data.SolderMask).toBe('Green');
  });

  it('accepts optional fields', () => {
    const data = assertParses(PlaceOrderInputSchema, {
      ...PCB_ORDER_REQUIRED,
      PcbFileUrl: 'https://example.com/board.zip',
      Note: 'Test order',
      BuyerEmail: 'test@example.com',
    });
    expect(data.PcbFileUrl).toBe('https://example.com/board.zip');
    expect(data.Note).toBe('Test order');
    expect(data.BuyerEmail).toBe('test@example.com');
  });

  it('rejects missing required fields', () => {
    assertRejects(PlaceOrderInputSchema, {}, 'PcbFileName');
    assertRejects(PlaceOrderInputSchema, { PcbFileName: 'x.zip' }, 'BuildDays');
  });
});

// ── Confirm Order ────────────────────────────────────────────────

describe('ConfirmOrderInputSchema', () => {
  it('parses valid input with only required fields', () => {
    const data = assertParses(ConfirmOrderInputSchema, { OrderNo: 'W0002AS1', PayType: 1 });
    expect(data.OrderNo).toBe('W0002AS1');
    expect(data.PayType).toBe(1);
  });

  it('accepts all optional fields', () => {
    const data = assertParses(ConfirmOrderInputSchema, {
      OrderNo: 'W0002AS1',
      PayType: 2,
      AddGroupNo: 'G123',
      ShipType: 1,
      Country: 'US',
      CountryCode: 'US',
      City: 'NYC',
      Addr: '123 Main St',
      Tel: '+1234567890',
    });
    expect(data.AddGroupNo).toBe('G123');
    expect(data.Country).toBe('US');
  });

  it('rejects missing OrderNo', () => {
    assertRejects(ConfirmOrderInputSchema, {}, 'OrderNo');
  });

  it('rejects missing PayType', () => {
    assertRejects(ConfirmOrderInputSchema, { OrderNo: 'W0002AS1' }, 'PayType');
  });
});

// ── Cancel Order ─────────────────────────────────────────────────

describe('CancelOrderInputSchema', () => {
  it('parses valid input', () => {
    const data = assertParses(CancelOrderInputSchema, { OrderNo: 'W0002AS1' });
    expect(data.OrderNo).toBe('W0002AS1');
  });

  it('rejects empty OrderNo', () => {
    assertRejects(CancelOrderInputSchema, {}, 'OrderNo');
    assertRejects(CancelOrderInputSchema, { OrderNo: '' }, 'OrderNo');
  });
});

// ── Check TGroup Order ───────────────────────────────────────────

describe('CheckTGroupOrderInputSchema', () => {
  it('parses valid input', () => {
    const data = assertParses(CheckTGroupOrderInputSchema, { TGroupNo: 'G1278395' });
    expect(data.TGroupNo).toBe('G1278395');
  });

  it('rejects empty TGroupNo', () => {
    assertRejects(CheckTGroupOrderInputSchema, {}, 'TGroupNo');
  });
});

// ── Pay TGroup Order ─────────────────────────────────────────────

describe('PayTGroupOrderInputSchema', () => {
  it('parses valid input', () => {
    const data = assertParses(PayTGroupOrderInputSchema, { TGroupNo: 'G1278395', PayType: 1 });
    expect(data.TGroupNo).toBe('G1278395');
    expect(data.PayType).toBe(1);
  });

  it('rejects missing fields', () => {
    assertRejects(PayTGroupOrderInputSchema, {}, 'TGroupNo');
    assertRejects(PayTGroupOrderInputSchema, { TGroupNo: 'G1' }, 'PayType');
  });
});

// ── Cancel TGroup Order ──────────────────────────────────────────

describe('CancelTGroupOrderInputSchema', () => {
  it('parses valid input', () => {
    const data = assertParses(CancelTGroupOrderInputSchema, { TGroupNo: 'G1278395' });
    expect(data.TGroupNo).toBe('G1278395');
  });

  it('rejects empty TGroupNo', () => {
    assertRejects(CancelTGroupOrderInputSchema, {}, 'TGroupNo');
  });
});

// ── Check Group Order ────────────────────────────────────────────

describe('CheckGroupOrderInputSchema', () => {
  it('parses valid input', () => {
    const data = assertParses(CheckGroupOrderInputSchema, { GroupNo: 'G378138' });
    expect(data.GroupNo).toBe('G378138');
  });

  it('rejects empty GroupNo', () => {
    assertRejects(CheckGroupOrderInputSchema, {}, 'GroupNo');
  });
});

// ── Get Countries ────────────────────────────────────────────────

describe('GetCountriesInputSchema', () => {
  it('parses empty object', () => {
    const data = assertParses(GetCountriesInputSchema, {});
    expect(data).toEqual({});
  });
});

// ── Get States ───────────────────────────────────────────────────

describe('GetStatesInputSchema', () => {
  it('parses valid input', () => {
    const data = assertParses(GetStatesInputSchema, { ...ADDRESS_REQUIRED });
    expect(data.Country).toBe('UNITED STATES OF AMERICA');
    expect(data.CountryCode).toBe('US');
  });

  it('rejects missing Country', () => {
    assertRejects(GetStatesInputSchema, {}, 'Country');
  });

  it('rejects missing CountryCode', () => {
    assertRejects(GetStatesInputSchema, { Country: 'US' }, 'CountryCode');
  });
});

// ── Get Cities ───────────────────────────────────────────────────

describe('GetCitiesInputSchema', () => {
  it('parses valid input', () => {
    const data = assertParses(GetCitiesInputSchema, { ...ADDRESS_REQUIRED, State: 'New York' });
    expect(data.Country).toBe('UNITED STATES OF AMERICA');
    expect(data.State).toBe('New York');
  });

  it('parses without optional State', () => {
    const data = assertParses(GetCitiesInputSchema, ADDRESS_REQUIRED);
    expect(data.State).toBeUndefined();
  });

  it('rejects missing Country', () => {
    assertRejects(GetCitiesInputSchema, {}, 'Country');
  });
});
