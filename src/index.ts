#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from './config.js';
import { PcbWayClient } from './client.js';
import { PcbQuote } from './resources/PcbQuote.js';
import { SmtQuote } from './resources/SmtQuote.js';
import { OrderProcess } from './resources/OrderProcess.js';
import { OrderDetails } from './resources/OrderDetails.js';
import { Shipping } from './resources/Shipping.js';
import { Account } from './resources/Account.js';
import { PlaceOrder } from './resources/PlaceOrder.js';
import { ConfirmOrder } from './resources/ConfirmOrder.js';
import { CancelOrder } from './resources/CancelOrder.js';
import { CheckTGroupOrder } from './resources/CheckTGroupOrder.js';
import { PayTGroupOrder } from './resources/PayTGroupOrder.js';
import { CancelTGroupOrder } from './resources/CancelTGroupOrder.js';
import { CheckGroupOrder } from './resources/CheckGroupOrder.js';
import { GetCountries } from './resources/GetCountries.js';
import { GetStates } from './resources/GetStates.js';
import { GetCities } from './resources/GetCities.js';

// ── Help flag ──────────────────────────────────────────────────────

function printHelp(): void {
  const help = `
pcbway-mcp — MCP server for the PCBWay Partner API

USAGE
  pcbway-mcp                        Start MCP server on stdin/stdout
  pcbway-mcp --help                  Print this help

ENVIRONMENT
  PCBWAY_API_KEY        (required) Your PCBWay Partner API Key
  PCBWAY_BASE_URL       (optional) API base URL
                            (default: https://api-partner.pcbway.com)
  PCBWAY_MAX_RETRIES    (optional) Max retries for transient failures (default: 3)
  PCBWAY_BASE_DELAY_MS  (optional) Base exponential-backoff delay in ms (default: 500)
  PCBWAY_TIMEOUT_MS     (optional) Request timeout in ms (default: 30000)

TOOLS (exposed via MCP)

  pcb_quote             Get PCB manufacturing price quote
                        Required: Country, CountryCode, ShipType, Postalcode,
                        City, Length, Width, Qty, Layers

  smt_quote             Get SMT assembly price quote
                        Required: Country, CountryCode, ShipType, Postalcode,
                        City, FlexibleOption, BoardType, AssemblySide, Qty

  order_process         Get fabrication status / completed steps for an order
                        Required: OrderNo

  order_details         Get full order details including all PCB parameters
                        Required: OrderNo

  shipping_freight      Get shipping cost for an order (call before payment)
                        Required: OrderNo, ShipType, Country, CountryCode,
                        Postalcode, City

  account_balance       Query PCBWay account balance, coupon, and points

  place_order           Add PCB order to cart
                        Required: PcbFileName, BuildDays, and PCB params

  confirm_order         Confirm orders / make payment
                        Required: OrderNo, PayType (+ address when not adding to package)

  cancel_order          Cancel an existing order
                        Required: OrderNo

  check_tgroup_order    Check awaiting-payment order package details
                        Required: TGroupNo

  pay_tgroup_order      Pay for an awaiting-payment order package
                        Required: TGroupNo, PayType

  cancel_tgroup_order   Cancel an awaiting-payment order package
                        Required: TGroupNo

  check_group_order     Check a confirmed order package details
                        Required: GroupNo

  get_countries         List all supported countries

  get_states            List states/provinces for a country
                        Required: Country, CountryCode

  get_cities            List cities for a country/state
                        Required: Country, CountryCode

SETUP
  1. Obtain your API Key from the PCBWay Partner dashboard
  2. Export the credential:
       export PCBWAY_API_KEY=your_api_key
  3. Run:
       npx pcbway-mcp-server

  Add to your MCP client config:
  {
    "mcpServers": {
      "pcbway": {
        "command": "npx",
        "args": ["-y", "pcbway-mcp-server"],
        "env": {
          "PCBWAY_API_KEY": "..."
        }
      }
    }
  }
`;
  // eslint-disable-next-line no-console
  console.log(help);
}

// ── Tool definitions ───────────────────────────────────────────────

const tools: Tool[] = [
  {
    name: 'pcb_quote',
    description: 'Get a PCB manufacturing price quote from PCBWay',
    inputSchema: {
      type: 'object',
      properties: {
        Country: { type: 'string', description: 'Country name (e.g. "UNITED STATES OF AMERICA")' },
        CountryCode: { type: 'string', description: 'Country code (e.g. "US")' },
        ShipType: { type: 'number', description: 'Logistics company (1=DHL, 10=FedEx IP, 4=SF Express, etc.)' },
        Postalcode: { type: 'string', description: 'Postal code' },
        City: { type: 'string', description: 'City' },
        Length: { type: 'number', description: 'Board length in mm' },
        Width: { type: 'number', description: 'Board width in mm' },
        Qty: { type: 'number', description: 'Quantity (5-10000)' },
        Layers: { type: 'number', description: 'Number of layers (1,2,4,6,8,10,12,14)' },
        BoardType: { type: 'string', description: 'Board type: "Single PCB" (default), "Panel PCB as design", "Panel PCB by Supplier"' },
        Material: { type: 'string', description: 'PCB material: FR-4 (default), Aluminum, Rogers, HDI, Copper' },
        FR4Tg: { type: 'string', description: 'FR4 Tg grade (default: TG150)' },
        Thickness: { type: 'number', description: 'Board thickness in mm (default: 1.6)' },
        MinTrackSpacing: { type: 'string', description: 'Min track/space (default: "6/6mil")' },
        MinHoleSize: { type: 'number', description: 'Min hole size in mm (default: 0.3)' },
        SolderMask: { type: 'string', description: 'Solder mask color (default: "Green")' },
        Silkscreen: { type: 'string', description: 'Silkscreen color (default: "White")' },
        SurfaceFinish: { type: 'string', description: 'Surface finish (default: "HASL with lead")' },
        ViaProcess: { type: 'string', description: 'Via process (default: "Tenting vias")' },
        FinishedCopper: { type: 'string', description: 'Copper weight (default: "1 oz Cu")' },
        Note: { type: 'string', description: 'Other special requests' },
      },
      required: ['Country', 'CountryCode', 'ShipType', 'Postalcode', 'City', 'Length', 'Width', 'Qty', 'Layers'],
    },
  },
  {
    name: 'smt_quote',
    description: 'Get an SMT assembly price quote from PCBWay',
    inputSchema: {
      type: 'object',
      properties: {
        Country: { type: 'string', description: 'Country name' },
        CountryCode: { type: 'string', description: 'Country code (e.g. "US")' },
        ShipType: { type: 'number', description: 'Logistics company (1=DHL, 10=FedEx IP, etc.)' },
        Postalcode: { type: 'string', description: 'Postal code' },
        City: { type: 'string', description: 'City' },
        FlexibleOption: { type: 'string', enum: ['Turnkey', 'Kitted or Consigned', 'Combo'], description: 'Assembly flexible option' },
        BoardType: { type: 'string', enum: ['Single pieces', 'Panelized PCBs'], description: 'Board type' },
        AssemblySide: { type: 'string', enum: ['Top side', 'Bottom side', 'Both sides'], description: 'Assembly side' },
        Qty: { type: 'number', description: 'Quantity to assemble' },
        UniqueParts: { type: 'number', description: 'Number of unique parts (default: 0)' },
        SMTParts: { type: 'number', description: 'Number of SMT parts (default: 0)' },
        HoleParts: { type: 'number', description: 'Number of through-hole parts (default: 0)' },
      },
      required: ['Country', 'CountryCode', 'ShipType', 'Postalcode', 'City', 'FlexibleOption', 'BoardType', 'AssemblySide', 'Qty'],
    },
  },
  {
    name: 'order_process',
    description: 'Get fabrication status and completed process steps for a PCBWay order',
    inputSchema: {
      type: 'object',
      properties: {
        OrderNo: { type: 'string', description: 'PCBWay order number (e.g. "W0002AS1")' },
      },
      required: ['OrderNo'],
    },
  },
  {
    name: 'order_details',
    description: 'Get full order details including all PCB parameters',
    inputSchema: {
      type: 'object',
      properties: {
        OrderNo: { type: 'string', description: 'PCBWay order number (e.g. "W0002AS1")' },
      },
      required: ['OrderNo'],
    },
  },
  {
    name: 'shipping_freight',
    description: 'Get shipping cost quote for an order (call before payment)',
    inputSchema: {
      type: 'object',
      properties: {
        OrderNo: { type: 'string', description: 'PCBWay order number (or comma-separated for multiple)' },
        ShipType: { type: 'number', description: 'Logistics company (1=DHL, 10=FedEx IP, etc.)' },
        Country: { type: 'string', description: 'Country name' },
        CountryCode: { type: 'string', description: 'Country code (e.g. "US")' },
        Postalcode: { type: 'string', description: 'Postal code' },
        City: { type: 'string', description: 'City' },
        State: { type: 'string', description: 'State/Province/Region (optional)' },
        AddGroupNo: { type: 'string', description: 'Order package number when adding to package (optional)' },
      },
      required: ['OrderNo', 'ShipType', 'Country', 'CountryCode', 'Postalcode', 'City'],
    },
  },
  {
    name: 'account_balance',
    description: 'Query PCBWay account balance, coupon value, and reward points',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'place_order',
    description: 'Add a PCB order to cart',
    inputSchema: {
      type: 'object',
      properties: {
        PcbFileName: { type: 'string', description: 'PCB file name' },
        BuildDays: { type: 'number', description: 'Production cycle in days (from quote)' },
        Length: { type: 'number', description: 'Board length in mm' },
        Width: { type: 'number', description: 'Board width in mm' },
        Qty: { type: 'number', description: 'Quantity' },
        Layers: { type: 'number', description: 'Number of layers' },
        BoardType: { type: 'string', description: 'Board type (default: "Single PCB")' },
        Material: { type: 'string', description: 'PCB material (default: "FR-4")' },
        Thickness: { type: 'number', description: 'Board thickness in mm (default: 1.6)' },
        SolderMask: { type: 'string', description: 'Solder mask color (default: "Green")' },
        Silkscreen: { type: 'string', description: 'Silkscreen color (default: "White")' },
        SurfaceFinish: { type: 'string', description: 'Surface finish (default: "HASL with lead")' },
        PcbFileUrl: { type: 'string', description: 'URL to PCB file (optional)' },
        Note: { type: 'string', description: 'Order notes (optional)' },
        BuyerEmail: { type: 'string', description: 'Buyer email for contact (optional)' },
      },
      required: ['PcbFileName', 'BuildDays', 'Length', 'Width', 'Qty', 'Layers'],
    },
  },
  {
    name: 'confirm_order',
    description: 'Confirm orders and make payment on PCBWay',
    inputSchema: {
      type: 'object',
      properties: {
        OrderNo: { type: 'string', description: 'Order number(s) — comma-separated for multiple' },
        PayType: { type: 'number', description: 'Payment method (1=AccountPay, 2=PCBWayWebPay)' },
        AddGroupNo: { type: 'string', description: 'Order package number when adding to package (optional)' },
        ShipType: { type: 'number', description: 'Logistics company (required unless adding to package)' },
        Country: { type: 'string', description: 'Country name (required unless adding to package)' },
        CountryCode: { type: 'string', description: 'Country code (required unless adding to package)' },
        State: { type: 'string', description: 'State/Province (optional)' },
        Postalcode: { type: 'string', description: 'Postal code (optional)' },
        City: { type: 'string', description: 'City (required unless adding to package)' },
        Addr: { type: 'string', description: 'Delivery address (required unless adding to package)' },
        CompanyName: { type: 'string', description: 'Company name (optional)' },
        ContactName: { type: 'string', description: 'Contact person (optional)' },
        Tel: { type: 'string', description: 'Phone number (required unless adding to package)' },
        BuyerEmail: { type: 'string', description: 'Buyer email for contact (optional)' },
        Tax: { type: 'string', description: 'Tax ID (optional)' },
      },
      required: ['OrderNo', 'PayType'],
    },
  },
  {
    name: 'cancel_order',
    description: 'Cancel an existing PCBWay order',
    inputSchema: {
      type: 'object',
      properties: {
        OrderNo: { type: 'string', description: 'PCBWay order number to cancel' },
      },
      required: ['OrderNo'],
    },
  },
  {
    name: 'check_tgroup_order',
    description: 'Check awaiting-payment order package details on PCBWay',
    inputSchema: {
      type: 'object',
      properties: {
        TGroupNo: { type: 'string', description: 'Awaiting-payment order package number' },
      },
      required: ['TGroupNo'],
    },
  },
  {
    name: 'pay_tgroup_order',
    description: 'Pay for an awaiting-payment order package on PCBWay',
    inputSchema: {
      type: 'object',
      properties: {
        TGroupNo: { type: 'string', description: 'Awaiting-payment order package number' },
        PayType: { type: 'number', description: 'Payment method (1=AccountPay, 2=PCBWayWebPay)' },
      },
      required: ['TGroupNo', 'PayType'],
    },
  },
  {
    name: 'cancel_tgroup_order',
    description: 'Cancel an awaiting-payment order package on PCBWay',
    inputSchema: {
      type: 'object',
      properties: {
        TGroupNo: { type: 'string', description: 'Awaiting-payment order package number' },
      },
      required: ['TGroupNo'],
    },
  },
  {
    name: 'check_group_order',
    description: 'Check a confirmed order package details on PCBWay',
    inputSchema: {
      type: 'object',
      properties: {
        GroupNo: { type: 'string', description: 'Order package number' },
      },
      required: ['GroupNo'],
    },
  },
  {
    name: 'get_countries',
    description: 'List all supported countries for PCBWay ordering',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_states',
    description: 'List states/provinces for a country',
    inputSchema: {
      type: 'object',
      properties: {
        Country: { type: 'string', description: 'Country name (e.g. "UNITED STATES OF AMERICA")' },
        CountryCode: { type: 'string', description: 'Country code (e.g. "US")' },
      },
      required: ['Country', 'CountryCode'],
    },
  },
  {
    name: 'get_cities',
    description: 'List cities for a country and state',
    inputSchema: {
      type: 'object',
      properties: {
        Country: { type: 'string', description: 'Country name (e.g. "UNITED STATES OF AMERICA")' },
        CountryCode: { type: 'string', description: 'Country code (e.g. "US")' },
        State: { type: 'string', description: 'State/Province to filter by (optional)' },
      },
      required: ['Country', 'CountryCode'],
    },
  },
];

// ── Server bootstrap ───────────────────────────────────────────────

async function main(): Promise<void> {
  // Handle --help before anything else
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  // Load config (will throw with clear message if env vars missing)
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(`Configuration error: ${(err as Error).message}`);
    process.exit(1);
  }

  const client = new PcbWayClient(config);
  const pcbQuote = new PcbQuote(client);
  const smtQuote = new SmtQuote(client);
  const orderProcess = new OrderProcess(client);
  const orderDetails = new OrderDetails(client);
  const shipping = new Shipping(client);
  const account = new Account(client);
  const placeOrder = new PlaceOrder(client);
  const confirmOrder = new ConfirmOrder(client);
  const cancelOrder = new CancelOrder(client);
  const checkTGroupOrder = new CheckTGroupOrder(client);
  const payTGroupOrder = new PayTGroupOrder(client);
  const cancelTGroupOrder = new CancelTGroupOrder(client);
  const checkGroupOrder = new CheckGroupOrder(client);
  const getCountries = new GetCountries(client);
  const getStates = new GetStates(client);
  const getCities = new GetCities(client);

  const server = new Server(
    {
      name: 'pcbway-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'pcb_quote': {
          const parsed = PcbQuote.inputSchema.parse(args);
          const text = await pcbQuote.getQuote(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'smt_quote': {
          const parsed = SmtQuote.inputSchema.parse(args);
          const text = await smtQuote.getQuote(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'order_process': {
          const parsed = OrderProcess.inputSchema.parse(args);
          const text = await orderProcess.getStatus(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'order_details': {
          const parsed = OrderDetails.inputSchema.parse(args);
          const text = await orderDetails.getDetails(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'shipping_freight': {
          const parsed = Shipping.inputSchema.parse(args);
          const text = await shipping.getFreight(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'account_balance': {
          const parsed = Account.inputSchema.parse(args ?? {});
          const text = await account.getBalance(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'place_order': {
          const parsed = PlaceOrder.inputSchema.parse(args);
          const text = await placeOrder.place(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'confirm_order': {
          const parsed = ConfirmOrder.inputSchema.parse(args);
          const text = await confirmOrder.confirm(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'cancel_order': {
          const parsed = CancelOrder.inputSchema.parse(args);
          const text = await cancelOrder.cancel(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'check_tgroup_order': {
          const parsed = CheckTGroupOrder.inputSchema.parse(args);
          const text = await checkTGroupOrder.check(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'pay_tgroup_order': {
          const parsed = PayTGroupOrder.inputSchema.parse(args);
          const text = await payTGroupOrder.pay(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'cancel_tgroup_order': {
          const parsed = CancelTGroupOrder.inputSchema.parse(args);
          const text = await cancelTGroupOrder.cancel(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'check_group_order': {
          const parsed = CheckGroupOrder.inputSchema.parse(args);
          const text = await checkGroupOrder.check(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'get_countries': {
          const parsed = GetCountries.inputSchema.parse(args ?? {});
          const text = await getCountries.get(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'get_states': {
          const parsed = GetStates.inputSchema.parse(args);
          const text = await getStates.get(parsed);
          return { content: [{ type: 'text', text }] };
        }

        case 'get_cities': {
          const parsed = GetCities.inputSchema.parse(args);
          const text = await getCities.get(parsed);
          return { content: [{ type: 'text', text }] };
        }

        default:
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
