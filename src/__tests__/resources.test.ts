import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { PcbWayClient } from '../client.js';
import { PcbQuote } from '../resources/PcbQuote.js';
import { SmtQuote } from '../resources/SmtQuote.js';
import { OrderProcess } from '../resources/OrderProcess.js';
import { OrderDetails } from '../resources/OrderDetails.js';
import { Shipping } from '../resources/Shipping.js';
import { Account } from '../resources/Account.js';
import { PlaceOrder } from '../resources/PlaceOrder.js';
import { ConfirmOrder } from '../resources/ConfirmOrder.js';
import { CancelOrder } from '../resources/CancelOrder.js';
import { CheckTGroupOrder } from '../resources/CheckTGroupOrder.js';
import { PayTGroupOrder } from '../resources/PayTGroupOrder.js';
import { CancelTGroupOrder } from '../resources/CancelTGroupOrder.js';
import { CheckGroupOrder } from '../resources/CheckGroupOrder.js';
import { GetCountries } from '../resources/GetCountries.js';
import { GetStates } from '../resources/GetStates.js';
import { GetCities } from '../resources/GetCities.js';

// ── Mock helpers ────────────────────────────────────────────────

function mockClient(): { client: PcbWayClient; request: Mock } {
  const request = vi.fn();
  const client = { request } as unknown as PcbWayClient;
  return { client, request };
}

/** Default PCB params fixture for quote & place-order */
const PCB_PARAMS = {
  Country: 'UNITED STATES OF AMERICA',
  CountryCode: 'US',
  ShipType: 1,
  Postalcode: '10001',
  City: 'New York',
  BoardType: 'Single PCB',
  DesignInPanel: 1,
  Length: 50,
  Width: 50,
  Qty: 10,
  Layers: 2,
  Material: 'FR-4',
  FR4Tg: 'TG150',
  Thickness: 1.6,
  MinTrackSpacing: '6/6mil',
  MinHoleSize: 0.3,
  SolderMask: 'Green',
  Silkscreen: 'White',
  SilkSides: 0,
  Goldfingers: 'No',
  SurfaceFinish: 'HASL with lead',
  ViaProcess: 'Tenting vias',
  FinishedCopper: '1 oz Cu',
  RemoveProductNo: 'No',
};

// ── PCB Quote ───────────────────────────────────────────────────

describe('PcbQuote.getQuote', () => {
  it('returns formatted quote with pricing and shipping', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok',
      ErrorText: null,
      Code: 0,
      priceList: [
        { BuildDays: 5, BuildText: '5 days', Express: true, Price: 25, Standard: false },
        { BuildDays: 10, BuildText: '10 days', Express: false, Price: 5, Standard: true },
      ],
      Shipping: { ShipCost: 8.5, ShipDays: '3-5', Weight: 150, IsRas: false },
    });

    const quote = new PcbQuote(client);
    const result = await quote.getQuote(PCB_PARAMS);

    // Verify request body includes PCB params + defaults
    expect(request).toHaveBeenCalledTimes(1);
    const [path, body] = request.mock.calls[0];
    expect(path).toBe('/api/Pcb/PcbQuotation');

    // Verify the markdown output
    expect(result).toContain('PCB Quotation Results');
    expect(result).toContain('$25.00');
    expect(result).toContain('$5.00');
    expect(result).toContain('$8.50');
    expect(result).toContain('150g');
    expect(result).toContain('Express');
    expect(result).toContain('Standard');
  });

  it('includes DHL surcharge warning when IsRas is true', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      priceList: [{ BuildDays: 10, BuildText: '10 days', Express: false, Price: 5, Standard: true }],
      Shipping: { ShipCost: 8.5, ShipDays: '3-5', Weight: 150, IsRas: true },
    });

    const result = await new PcbQuote(client).getQuote(PCB_PARAMS);
    expect(result).toContain('Remote Area Surcharge');
  });

  it('populates null defaults in request body', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      priceList: [], Shipping: null,
    });

    await new PcbQuote(client).getQuote(PCB_PARAMS);

    const body = request.mock.calls[0][1] as Record<string, unknown>;
    expect(body.cxipt).toBeNull();
    expect(body.StructureMCPCB).toBe('middle');
    expect(body.RemoveProductNo).toBe('No');
  });

  it('handles economy shipping tier (Express=false, Standard=false)', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      priceList: [
        { BuildDays: 15, BuildText: '15 days', Express: false, Price: 2.5, Standard: false },
      ],
      Shipping: null,
    });

    const result = await new PcbQuote(client).getQuote(PCB_PARAMS);
    expect(result).toContain('Economy');
    expect(result).toContain('$2.50');
  });
});

// ── SMT Quote ───────────────────────────────────────────────────

describe('SmtQuote.getQuote', () => {
  it('returns formatted SMT quote', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      priceList: [
        { BuildDays: 7, BuildText: '7 days', Express: false, Price: 29, Standard: true },
      ],
      Shipping: { ShipCost: 12, ShipDays: '5-7', Weight: 200, IsRas: false },
    });

    const result = await new SmtQuote(client).getQuote({
      ...PCB_PARAMS,
      FlexibleOption: 'Turnkey',
      BoardType: 'Single pieces',
      AssemblySide: 'Both sides',
      Qty: 100,
      UniqueParts: 10,
      SMTParts: 50,
      HoleParts: 5,
    });

    expect(result).toContain('SMT Assembly Quotation');
    expect(result).toContain('$29.00');
    expect(result).toContain('$12.00');
  });

  it('handles economy pricing item and missing Shipping', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      priceList: [
        { BuildDays: 20, BuildText: '20 days', Express: false, Price: 3.0, Standard: false },
      ],
      Shipping: null,
    });

    const result = await new SmtQuote(client).getQuote({
      ...PCB_PARAMS,
      FlexibleOption: 'Turnkey',
      BoardType: 'Single pieces',
      AssemblySide: 'Top side',
      Qty: 10, UniqueParts: 5, SMTParts: 20, HoleParts: 2,
    });

    expect(result).toContain('Economy');
    expect(result).toContain('$3.00');
    expect(result).not.toContain('Shipping'); // no shipping section
  });

  it('handles Express item and remote area surcharge', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      priceList: [
        { BuildDays: 3, BuildText: '3 days', Express: true, Price: 50, Standard: false },
      ],
      Shipping: { ShipCost: 20, ShipDays: '1-2', Weight: 200, IsRas: true },
    });

    const result = await new SmtQuote(client).getQuote({
      ...PCB_PARAMS,
      FlexibleOption: 'Turnkey',
      BoardType: 'Single pieces',
      AssemblySide: 'Top side',
      Qty: 10, UniqueParts: 5, SMTParts: 20, HoleParts: 2,
    });

    expect(result).toContain('Express');
    expect(result).toContain('$50.00');
    expect(result).toContain('$20.00');
    expect(result).toContain('Remote Area Surcharge');
  });
});

// ── Order Process ───────────────────────────────────────────────

describe('OrderProcess.getStatus', () => {
  it('shows all processes and completed steps', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      AllProcess: ['Design Review', 'Panelization', 'Fabrication', 'AOI', 'Shipping'],
      List: [
        { Name: 'Design Review', Time: '2025-06-01T10:00:00Z' },
        { Name: 'Panelization', Time: '2025-06-02T10:00:00Z' },
      ],
    });

    const result = await new OrderProcess(client).getStatus({ OrderNo: 'W0002AS1' });
    expect(result).toContain('Order W0002AS1');
    expect(result).toContain('Design Review');
    expect(result).toContain('Panelization');
    expect(result).toContain('✅');
  });

  it('handles empty completed steps', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      AllProcess: ['Design Review'],
      List: [],
    });

    const result = await new OrderProcess(client).getStatus({ OrderNo: 'TEST' });
    expect(result).toContain('No steps completed yet.');
  });
});

// ── Order Details ───────────────────────────────────────────────

describe('OrderDetails.getDetails', () => {
  const mockPcbModel = {
    GroupNo: 'G123',
    Status: 2,
    IsPaid: true,
    Price: 45.5,
    FileUrl: 'https://pcbway.com/files/board.zip',
    FileName: 'board.zip',
    Note: 'Test order',
    BuildDays: 5,
    DeliveryDate: '2025-06-15T10:00:00Z',
    AuditResult: 'PASS',
    Length: 50, Width: 50, Qty: 10, Layers: 2,
    Material: 'FR-4', Thickness: 1.6,
    BoardType: 'Single PCB', DesignInPanel: 1,
    MinTrackSpacing: '6/6mil', MinHoleSize: 0.3,
    SolderMask: 'Green', Silkscreen: 'White',
    SurfaceFinish: 'HASL with lead', FinishedCopper: '1 oz Cu',
    ViaProcess: 'Tenting vias',
    // Fill remaining string fields
    cxipt: '', cxiptselectiveGold: '', cxiptselectiveHold: '', cxiptselectiveGoldHold: '',
    XoutAllowance: '', EdgeRails: '', EdgeRailsContent: '', RouteProcess: '',
    PinBanNum: 0, CopperLayer: '', CopperSolderMask: '', CopperSilkscreen: '',
    FR4Tg: '', TCE: '', Rogers: '', MinTrackSpacing: '', MinHoleSize: 0,
    SilkSides: 0, Goldfingers: '', GoldFingersBevelling: '', GoldPlatingType: '',
    GoldThickness: '', GoldThicknessSelective: '', RemoveProductNo: '',
    InsideThickness: '', BoardThickness: '', AUGoldThickness: '', NiGoldThickness: '',
    SendAUGoldThickness: '', SendNiGoldThickness: '', SendPdAUGoldThickness: '',
    SendPdNiGoldThickness: '', SendPdPdGoldThickness: '', AuHoldSelective: '',
    NiHoldSelective: '', GoldHoldSelective: '', AuGoldHoldSelective: '',
    NiGoldHoldSelective: '', GoldFingerThickness: '', PdAUGoldThickness: '',
    PdNiGoldThickness: '', PdPdGoldThickness: '', StructureMCPCB: '',
    AllowENIG: '', DateCode: '', DataCodeDes: '', PlatedHalfHole: '',
    PeelableSoldermask: '', ThermoelectricSeparation: '', ImpedanceControl: '',
    ViaPadOrViaResin: '', ViaPadNew: '', Buriedblind: '', Viafilled: '',
    ECopperPCB: '', EResistorPCB: '', CavityPCB: '', SemiFlexPCB: '',
    WPHybridPCB: '', BackplanePCB: '', LeadlessHardGold: '', HoleCopperThickness: '',
    ULMaker: '', PaperBetweenPCBs: '', AddSerialNumbers: '', PackageBox: '',
    SidePlating: '', CarbonMask: '', CustomStackup: '', Countersink: '',
    HalogenFree: '', BlackFR4blackcore: '', Pressfitholes: '', AcceptHASLUp: '',
    Zaxis: '',
  };

  it('returns formatted order details', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      PcbModel: mockPcbModel,
    });

    const result = await new OrderDetails(client).getDetails({ OrderNo: 'W0002AS1' });
    expect(result).toContain('Order W0002AS1');
    expect(result).toContain('$45.50');
    expect(result).toContain('Processing'); // Status 2 = Processing
    expect(result).toContain('50mm × 50mm');
    expect(result).toContain('PASS');
    expect(result).toContain('FR-4');
    expect(result).toContain('board.zip');
  });

  it('handles null fields (FileUrl, Note, GroupNo) and unknown status', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      PcbModel: {
        ...mockPcbModel,
        Status: 99,
        FileUrl: null,
        Note: null,
        GroupNo: null,
        Price: 0,
        IsPaid: false,
      },
    });

    const result = await new OrderDetails(client).getDetails({ OrderNo: 'W999' });
    expect(result).toContain('99'); // unknown status displayed as raw number
    expect(result).toContain('$0.00');
    expect(result).toContain('No'); // IsPaid => No
    expect(result).not.toContain('**File:'); // FileUrl falsy → empty string
    expect(result).not.toContain('**Notes:'); // Note falsy → empty string
    expect(result).not.toContain('**Group No:'); // GroupNo falsy → empty string
  });
});

// ── Shipping ────────────────────────────────────────────────────

describe('Shipping.getFreight', () => {
  it('returns formatted freight quote', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      Days: '3-5', Price: 15.5, IsRas: false,
    });

    const params = {
      OrderNo: 'W0002AS1', ShipType: 1,
      Country: 'US', CountryCode: 'US',
      Postalcode: '10001', City: 'NYC',
    };
    const result = await new Shipping(client).getFreight(params);
    expect(result).toContain('Freight Quote');
    expect(result).toContain('$15.50');
    expect(result).toContain('3-5 days');
  });

  it('warns on remote area surcharge', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      Days: '3-5', Price: 15.5, IsRas: true,
    });

    const result = await new Shipping(client).getFreight({
      OrderNo: 'W0002AS1', ShipType: 1,
      Country: 'US', CountryCode: 'US',
      Postalcode: '10001', City: 'NYC',
    });
    expect(result).toContain('Remote Area');
  });

  it('resolves ship type name from SHIP_TYPES', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      Days: '3-5', Price: 15.5, IsRas: false,
    });

    // ShipType 10 = FedEx_IP
    const result = await new Shipping(client).getFreight({
      OrderNo: 'W0002AS1', ShipType: 10,
      Country: 'US', CountryCode: 'US',
      Postalcode: '10001', City: 'NYC',
    });
    expect(result).toContain('FedEx_IP');
  });

  it('falls back to "Type N" for unknown ShipType', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      Days: '5-7', Price: 20, IsRas: false,
    });

    const result = await new Shipping(client).getFreight({
      OrderNo: 'W0002AS1', ShipType: 99,
      Country: 'US', CountryCode: 'US',
      Postalcode: '10001', City: 'NYC',
    });
    expect(result).toContain('Type 99');
  });
});

// ── Account ─────────────────────────────────────────────────────

describe('Account.getBalance', () => {
  it('returns formatted balance', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      balance: 150.0, coupon: 25.0, point: 500,
    });

    const result = await new Account(client).getBalance({});
    expect(result).toContain('Account Balance');
    expect(result).toContain('$150.00');
    expect(result).toContain('$25.00');
    expect(result).toContain('500');
  });
});

// ── Place Order ─────────────────────────────────────────────────

describe('PlaceOrder.place', () => {
  it('returns order confirmation with details', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      OrderNo: 'W0002AS1', DeliveryDate: '2025-06-15T10:00:00Z', Price: 45.5,
    });

    const result = await new PlaceOrder(client).place({
      PcbFileName: 'board.zip',
      BuildDays: 5,
      Length: 50, Width: 50, Qty: 10, Layers: 2,
    });

    expect(result).toContain('Order Placed Successfully');
    expect(result).toContain('W0002AS1');
    expect(result).toContain('$45.50');
  });

  it('sends null defaults for advanced PCB fields', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      OrderNo: 'W', DeliveryDate: '2025-01-01', Price: 0,
    });

    await new PlaceOrder(client).place({
      PcbFileName: 'board.zip',
      BuildDays: 5,
      Length: 50, Width: 50, Qty: 10, Layers: 2,
    });

    const body = request.mock.calls[0][1] as Record<string, unknown>;
    expect(body.cxipt).toBeNull();
    expect(body.EdgeRails).toBeNull();
    expect(body.cxipt).toBeNull();
    expect(body.StructureMCPCB).toBe('middle');
  });
});

// ── Confirm Order ───────────────────────────────────────────────

describe('ConfirmOrder.confirm', () => {
  it('returns confirmation with payment details', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      DeliveryDate: '2025-06-20', GroupNo: 'G123', TGroupNo: null,
      TotalAmount: 55.0, AccountBalance: 100.0, PayType: 1,
      PCBWayPayUrl: null,
    });

    const result = await new ConfirmOrder(client).confirm({
      OrderNo: 'W0002AS1', PayType: 1,
    });

    expect(result).toContain('Confirm Order / Payment');
    expect(result).toContain('$55.00');
    expect(result).toContain('$100.00');
    expect(result).toContain('AccountPay');
    expect(result).toContain('G123');
  });

  it('shows payment URL when PCBWayWebPay', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      DeliveryDate: null, GroupNo: null, TGroupNo: 'TG123',
      TotalAmount: 55.0, AccountBalance: 0, PayType: 2,
      PCBWayPayUrl: 'https://pay.pcbway.com/abc',
    });

    const result = await new ConfirmOrder(client).confirm({
      OrderNo: 'W0002AS1', PayType: 2,
    });

    expect(result).toContain('PCBWayWebPay');
    expect(result).toContain('TG123');
    expect(result).toContain('https://pay.pcbway.com/abc');
  });

  it('falls back to "Type N" for unknown PayType', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      DeliveryDate: '2025-07-01', GroupNo: null, TGroupNo: null,
      TotalAmount: 60, AccountBalance: 30, PayType: 99,
      PCBWayPayUrl: null,
    });

    const result = await new ConfirmOrder(client).confirm({
      OrderNo: 'W0002AS1', PayType: 99,
    });

    expect(result).toContain('Type 99');
    expect(result).toContain('$60.00');
    expect(result).toContain('2025-07-01');
  });
});

// ── Cancel Order ────────────────────────────────────────────────

describe('CancelOrder.cancel', () => {
  it('returns cancellation confirmation', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      OrderNo: 'W0002AS1',
    });

    const result = await new CancelOrder(client).cancel({ OrderNo: 'W0002AS1' });
    expect(result).toContain('Cancel Order');
    expect(result).toContain('W0002AS1');
    expect(result).toContain('Cancelled');
  });
});

// ── Check TGroup Order ──────────────────────────────────────────

describe('CheckTGroupOrder.check', () => {
  it('returns package details with orders', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      TGroupOrder: {
        CreateTime: '2025-06-01', TGroupNo: 'TG123', AddGroupNo: '',
        TotalMoney: 100, FeePaypal: 2.5, ShipMoney: 15, Tax: '0',
        ShipType: 1, Country: 'US', State: 'NY', Postalcode: '10001',
        City: 'NYC', Addr: '123 Main', CompanyName: '', ContactName: 'John',
        Tel: '+1',
      },
      OrderList: [
        { GroupNo: 'G1', Status: 1, IsPaid: false, Price: 45.5 } as Record<string, unknown>,
      ],
    });

    const result = await new CheckTGroupOrder(client).check({ TGroupNo: 'TG123' });
    expect(result).toContain('Awaiting-Payment Order Package');
    expect(result).toContain('TG123');
    expect(result).toContain('$100.00');
    expect(result).toContain('$15.00');
    expect(result).toContain('Orders in Package');
  });

  it('renders AddGroupNo and populated OrderList', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      TGroupOrder: {
        CreateTime: '2025-07-01', TGroupNo: 'TG789', AddGroupNo: 'G999',
        TotalMoney: 250, FeePaypal: 5, ShipMoney: 20, Tax: '10',
        ShipType: 10, Country: 'CA', State: 'ON', Postalcode: 'M5A',
        City: 'Toronto', Addr: '456 Maple', CompanyName: 'Corp', ContactName: 'Alice',
        Tel: '+1',
      },
      OrderList: [
        { GroupNo: 'G3', Status: 2, IsPaid: true, Price: 150 },
        { GroupNo: 'G4', Status: 1, IsPaid: false, Price: 100 },
      ],
    });

    const result = await new CheckTGroupOrder(client).check({ TGroupNo: 'TG789' });
    expect(result).toContain('TG789');
    expect(result).toContain('**Add Package:** G999');
    expect(result).toContain('Orders in Package (2)');
    expect(result).toContain('$150.00');
  });

  it('handles empty OrderList', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      TGroupOrder: {
        CreateTime: '2025-08-01', TGroupNo: 'TG000', AddGroupNo: '',
        TotalMoney: 0, FeePaypal: 0, ShipMoney: 0, Tax: '0',
        ShipType: 1, Country: 'US', State: '', Postalcode: '',
        City: '', Addr: '', CompanyName: '', ContactName: '',
        Tel: '',
      },
      OrderList: [],
    });

    const result = await new CheckTGroupOrder(client).check({ TGroupNo: 'TG000' });
    expect(result).toContain('TG000');
    expect(result).not.toContain('Orders in Package');
  });
});

// ── Pay TGroup Order ────────────────────────────────────────────

describe('PayTGroupOrder.pay', () => {
  it('returns payment confirmation', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      DeliveryDate: '2025-06-20', GroupNo: 'G456', TGroupNo: 'TG123',
      TotalAmount: 100, AccountBalance: 50, PayType: 1,
      PCBWayPayUrl: null,
    });

    const result = await new PayTGroupOrder(client).pay({ TGroupNo: 'TG123', PayType: 1 });
    expect(result).toContain('Pay Awaiting-Payment Package');
    expect(result).toContain('$100.00');
    expect(result).toContain('$50.00');
    expect(result).toContain('AccountPay');
    expect(result).toContain('G456');
  });

  it('handles unknown PayType and includes payment URL', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      DeliveryDate: null, GroupNo: null, TGroupNo: 'TG999',
      TotalAmount: 200, AccountBalance: 0, PayType: 99,
      PCBWayPayUrl: 'https://pay.pcbway.com/pay/999',
    });

    const result = await new PayTGroupOrder(client).pay({ TGroupNo: 'TG999', PayType: 99 });
    expect(result).toContain('Type 99');
    expect(result).toContain('$200.00');
    expect(result).toContain('https://pay.pcbway.com/pay/999');
  });

  it('handles minimal response with null fields', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      DeliveryDate: null, GroupNo: null, TGroupNo: null,
      TotalAmount: 0, AccountBalance: 0, PayType: 1,
      PCBWayPayUrl: null,
    });

    const result = await new PayTGroupOrder(client).pay({ TGroupNo: 'TG000', PayType: 1 });
    expect(result).toContain('$0.00');
    expect(result).not.toContain('**Delivery Date:'); // null → no line
    expect(result).not.toContain('**Order Package:'); // GroupNo null → no line
    expect(result).not.toContain('**Awaiting Payment Package:'); // TGroupNo null → no line
    expect(result).not.toContain('**Payment URL:'); // PCBWayPayUrl null → no line
  });
});

// ── Cancel TGroup Order ─────────────────────────────────────────

describe('CancelTGroupOrder.cancel', () => {
  it('returns cancellation confirmation', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      TGroupNo: 'TG123',
    });

    const result = await new CancelTGroupOrder(client).cancel({ TGroupNo: 'TG123' });
    expect(result).toContain('Cancel Awaiting-Payment Package');
    expect(result).toContain('TG123');
    expect(result).toContain('Cancelled');
  });
});

// ── Check Group Order ────────────────────────────────────────────

describe('CheckGroupOrder.check', () => {
  it('returns confirmed package details', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      GroupOrder: {
        CreateTime: '2025-06-01', GroupNo: 'G456',
        TotalMoney: 200, FeePaypal: 4, ShipMoney: 20, Tax: '5',
        ShipType: 1, Country: 'US', State: 'CA', Postalcode: '90001',
        City: 'LA', Addr: '456 Oak', CompanyName: 'Acme', ContactName: 'Jane',
        Tel: '+1',
      },
      OrderList: [],
    });

    const result = await new CheckGroupOrder(client).check({ GroupNo: 'G456' });
    expect(result).toContain('Order Package Details');
    expect(result).toContain('G456');
    expect(result).toContain('$200.00');
    expect(result).toContain('Jane');
  });

  it('renders OrderList when present', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      GroupOrder: {
        CreateTime: '2025-06-01', GroupNo: 'G789',
        TotalMoney: 300, FeePaypal: 6, ShipMoney: 25, Tax: '0',
        ShipType: 1, Country: 'US', State: 'NY', Postalcode: '10001',
        City: 'NYC', Addr: '123 Main', CompanyName: '', ContactName: 'John',
        Tel: '+1',
      },
      OrderList: [
        { GroupNo: 'G1', Status: 1, IsPaid: false, Price: 100 },
        { GroupNo: 'G2', Status: 2, IsPaid: true, Price: 200 },
      ],
    });

    const result = await new CheckGroupOrder(client).check({ GroupNo: 'G789' });
    expect(result).toContain('Orders in Package (2)');
    expect(result).toContain('$100.00');
    expect(result).toContain('$200.00');
  });

  it('handles undefined OrderList', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      GroupOrder: {
        CreateTime: '2025-06-01', GroupNo: 'G000',
        TotalMoney: 0, FeePaypal: 0, ShipMoney: 0, Tax: '0',
        ShipType: 1, Country: 'US', State: '', Postalcode: '',
        City: '', Addr: '', CompanyName: '', ContactName: '',
        Tel: '',
      },
      // OrderList omitted — undefined
    });

    const result = await new CheckGroupOrder(client).check({ GroupNo: 'G000' });
    expect(result).not.toContain('Orders in Package');
  });
});

// ── Get Countries ───────────────────────────────────────────────

describe('GetCountries.get', () => {
  it('returns formatted country list', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      Countrys: [
        { Country: 'UNITED STATES OF AMERICA', CountryCode: 'US' },
        { Country: 'CANADA', CountryCode: 'CA' },
      ],
    });

    const result = await new GetCountries(client).get({});
    expect(result).toContain('Supported Countries');
    expect(result).toContain('**UNITED STATES OF AMERICA** (US)');
    expect(result).toContain('2 countries total');
  });
});

// ── Get States ──────────────────────────────────────────────────

describe('GetStates.get', () => {
  it('returns formatted state list', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      States: ['California', 'New York', 'Texas'],
    });

    const result = await new GetStates(client).get({
      Country: 'UNITED STATES OF AMERICA', CountryCode: 'US',
    });
    expect(result).toContain('States/Provinces');
    expect(result).toContain('California');
    expect(result).toContain('3 regions total');
  });

  it('returns message when no states', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      States: [],
    });

    const result = await new GetStates(client).get({
      Country: 'UNITED STATES OF AMERICA', CountryCode: 'US',
    });
    expect(result).toContain('No states/provinces found');
  });
});

// ── Get Cities ──────────────────────────────────────────────────

describe('GetCities.get', () => {
  it('returns formatted city list', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      Citys: [
        { Postalcode: '10001', City: 'New York' },
        { Postalcode: '10002', City: 'Manhattan' },
      ],
    });

    const result = await new GetCities(client).get({
      Country: 'UNITED STATES OF AMERICA', CountryCode: 'US', State: 'New York',
    });
    expect(result).toContain('Cities');
    expect(result).toContain('**New York** (10001)');
    expect(result).toContain('2 cities total');
  });

  it('returns message when no cities', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      Citys: [],
    });

    const result = await new GetCities(client).get({
      Country: 'UNITED STATES OF AMERICA', CountryCode: 'US', State: 'Nowhere',
    });
    expect(result).toContain('No cities found');
  });

  it('handles missing State parameter (null branch)', async () => {
    const { client, request } = mockClient();
    request.mockResolvedValue({
      Status: 'ok', ErrorText: null, Code: 0,
      Citys: [{ Postalcode: '10001', City: 'New York' }],
    });

    // Omit State entirely — let it become null
    const result = await new GetCities(client).get({
      Country: 'UNITED STATES OF AMERICA', CountryCode: 'US',
    });
    expect(result).toContain('New York');

    // Verify null was sent in request body
    const body = request.mock.calls[0][1] as Record<string, unknown>;
    expect(body.State).toBeNull();
  });
});
