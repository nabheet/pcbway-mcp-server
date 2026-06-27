# pcbway-mcp-server

[![CI](https://github.com/nabheet/pcbway-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/nabheet/pcbway-mcp-server/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/pcbway-mcp-server)](https://www.npmjs.com/package/pcbway-mcp-server)
[![License](https://img.shields.io/github/license/nabheet/pcbway-mcp-server)](LICENSE)

**Get instant PCB manufacturing and assembly quotes, place orders, and track fabrication — all from your AI coding assistant.** This MCP server gives you full access to the PCBWay Partner API: PCB pricing, SMT assembly quotes, order lifecycle (place, confirm, cancel, track), shipping costs, and account balance — compatible with Claude Desktop, opencode, Cursor, and any MCP client.

## Features

- **PCB Quote** — Instant PCB manufacturing pricing with turn time options
- **SMT Quote** — SMT assembly pricing by part counts
- **Order Lifecycle** — Place, confirm, cancel orders; query fabrication status & details
- **Order Package Management** — Check, pay, and cancel awaiting-payment packages; inspect confirmed packages
- **Shipping** — Pre-payment freight cost estimate
- **Account** — Balance, coupon value, reward points
- **Address Lookup** — Countries, states/provinces, cities with postal codes
- **16 MCP tools** covering all documented PCBWay Partner API endpoints

## Requirements

- Node.js >= 18
- A PCBWay Partner account with an **API Key**

## Setup

### 1. Get API Credentials

Contact PCBWay partner support to request an **API Key** for your account.

### 2. Install

```bash
npm install -g pcbway-mcp-server
```

Or run directly:

```bash
npx pcbway-mcp-server
```

### 3. Configure Environment

```bash
# Required:
export PCBWAY_API_KEY=your_api_key

# Optional overrides:
export PCBWAY_BASE_URL=https://api-partner.pcbway.com   # API base
export PCBWAY_MAX_RETRIES=3                               # Max retries for transient failures
export PCBWAY_BASE_DELAY_MS=500                           # Base exponential-backoff delay (ms)
export PCBWAY_TIMEOUT_MS=30000                            # Request timeout (ms)
```

**Note:** The PCBWay Partner API uses a single `api-key` header for authentication. There is no App ID, HMAC signing, or timestamp required.

### 4. Run

```bash
npx pcbway-mcp-server
```

## MCP Client Configuration

```json
{
  "mcpServers": {
    "pcbway": {
      "command": "npx",
      "args": ["-y", "pcbway-mcp-server"],
      "env": {
        "PCBWAY_API_KEY": "your_api_key"
        // Optional: PCBWAY_MAX_RETRIES, PCBWAY_BASE_DELAY_MS, PCBWAY_TIMEOUT_MS, PCBWAY_BASE_URL
      }
    }
  }
}
```

**Never hardcode credentials in configs that are shared or committed.**

## Available Tools

### `pcb_quote`

PCB manufacturing price quote. Requires shipping destination and board parameters.

| Argument | Type | Required | Description |
|---|---|---|---|
| `Country` | string | ✓ | Country name (e.g. "UNITED STATES OF AMERICA") |
| `CountryCode` | string | ✓ | ISO country code (e.g. "US") |
| `ShipType` | number | ✓ | Carrier: 1=DHL, 10=FedEx IP, 4=SF Express, 6=EMS, 7=E-packet, 9=China Post, 35=Global Standard |
| `Postalcode` | string | ✓ | Postal / ZIP code |
| `City` | string | ✓ | City |
| `Length` | number | ✓ | Board length in mm |
| `Width` | number | ✓ | Board width in mm |
| `Qty` | number | ✓ | Quantity (5–10000) |
| `Layers` | number | ✓ | Layer count: 1, 2, 4, 6, 8, 10, 12, 14 |

Returns pricing by build speed (Standard / Express) with shipping cost.

### `smt_quote`

SMT assembly price quote. Uses simple part counts (not a full BOM).

| Argument | Type | Required | Description |
|---|---|---|---|
| `Country` | string | ✓ | Country name |
| `CountryCode` | string | ✓ | ISO country code |
| `ShipType` | number | ✓ | Carrier ID |
| `Postalcode` | string | ✓ | Postal code |
| `City` | string | ✓ | City |
| `FlexibleOption` | string | ✓ | "Turnkey", "Kitted or Consigned", "Combo" |
| `BoardType` | string | ✓ | "Single pieces" or "Panelized PCBs" |
| `AssemblySide` | string | ✓ | "Top side", "Bottom side", or "Both sides" |
| `Qty` | number | ✓ | Quantity to assemble |
| `UniqueParts` | number | | Number of unique parts (default 0) |
| `SMTParts` | number | | Number of SMT parts (default 0) |
| `HoleParts` | number | | Number of through-hole parts (default 0) |

### `order_process`

Get fabrication status — shows all required processes and which are completed.

| Argument | Type | Required | Description |
|---|---|---|---|
| `OrderNo` | string | ✓ | PCBWay order number (e.g. "W0002AS1") |

### `order_details`

Get full order details including all PCB parameters (dimensions, material, finish, audit result, delivery date, etc.)

| Argument | Type | Required | Description |
|---|---|---|---|
| `OrderNo` | string | ✓ | PCBWay order number |

### `shipping_freight`

Get shipping cost before payment (call after placing order, before confirming).

| Argument | Type | Required | Description |
|---|---|---|---|
| `OrderNo` | string | ✓ | Order number (comma-separated for joint shipment) |
| `ShipType` | number | ✓ | Carrier ID |
| `Country` | string | ✓ | Country name |
| `CountryCode` | string | ✓ | ISO country code |
| `Postalcode` | string | ✓ | Postal code |
| `City` | string | ✓ | City |
| `State` | string | | State / Province (optional) |
| `AddGroupNo` | string | | Order package number when adding to package (optional) |

### `account_balance`

Query PCBWay account balance, coupon value, and reward points. No parameters required.

### `place_order`

Add a PCB order to your cart. Requires PCB file and all board parameters.

| Argument | Type | Required | Description |
|---|---|---|---|
| `PcbFileName` | string | ✓ | PCB file name |
| `BuildDays` | number | ✓ | Production cycle from quote response |
| `Length` | number | ✓ | Board length in mm |
| `Width` | number | ✓ | Board width in mm |
| `Qty` | number | ✓ | Quantity |
| `Layers` | number | ✓ | Layer count |
| `BoardType` | string | | "Single PCB" (default), "Panel PCB as design", "Panel PCB by Supplier" |
| `Material` | string | | "FR-4" (default) |
| `Thickness` | number | | Board thickness in mm (default 1.6) |
| `SolderMask` | string | | "Green" (default) |
| `Silkscreen` | string | | "White" (default) |
| `SurfaceFinish` | string | | "HASL with lead" (default) |
| `PcbFileUrl` | string | | URL to PCB Gerber zip file |
| `Note` | string | | Order notes (optional) |
| `BuyerEmail` | string | | Email for contact |

### `confirm_order`

Confirm orders and make payment. Can confirm single or multiple orders together.

| Argument | Type | Required | Description |
|---|---|---|---|
| `OrderNo` | string | ✓ | Order number(s), comma-separated for multiple |
| `PayType` | number | ✓ | Payment method: 1=AccountPay, 2=PCBWayWebPay |
| `ShipType` | number | | Carrier (required unless adding to package) |
| `Country` | string | | Country name (required unless adding to package) |
| `CountryCode` | string | | ISO country code (required unless adding to package) |
| `City` | string | | City (required unless adding to package) |
| `Addr` | string | | Delivery address (required unless adding to package) |
| `Tel` | string | | Phone number (required unless adding to package) |
| `AddGroupNo` | string | | Order package number when adding to existing package |
| `State` | string | | State / Province |
| `Postalcode` | string | | Postal code |
| `ContactName` | string | | Contact person |
| `CompanyName` | string | | Company name |
| `BuyerEmail` | string | | Email for contact |
| `Tax` | string | | Tax ID |

### `cancel_order`

Cancel an existing PCBWay order.

| Argument | Type | Required | Description |
|---|---|---|---|
| `OrderNo` | string | ✓ | Order number to cancel |

### `check_tgroup_order`

Check awaiting-payment order package details.

| Argument | Type | Required | Description |
|---|---|---|---|
| `TGroupNo` | string | ✓ | Awaiting-payment package number |

### `pay_tgroup_order`

Pay for an awaiting-payment order package.

| Argument | Type | Required | Description |
|---|---|---|---|
| `TGroupNo` | string | ✓ | Awaiting-payment package number |
| `PayType` | number | ✓ | 1=AccountPay, 2=PCBWayWebPay |

### `cancel_tgroup_order`

Cancel an awaiting-payment order package.

| Argument | Type | Required | Description |
|---|---|---|---|
| `TGroupNo` | string | ✓ | Awaiting-payment package number to cancel |

### `check_group_order`

Check a confirmed (paid) order package details.

| Argument | Type | Required | Description |
|---|---|---|---|
| `GroupNo` | string | ✓ | Confirmed order package number |

### `get_countries`

List all supported countries for PCBWay ordering. No parameters required.

### `get_states`

List states/provinces for a country.

| Argument | Type | Required | Description |
|---|---|---|---|
| `Country` | string | ✓ | Country name (e.g. "UNITED STATES OF AMERICA") |
| `CountryCode` | string | ✓ | ISO country code (e.g. "US") |

### `get_cities`

List cities with postal codes for a country/state.

| Argument | Type | Required | Description |
|---|---|---|---|
| `Country` | string | ✓ | Country name |
| `CountryCode` | string | ✓ | ISO country code |
| `State` | string | | State/Province to filter by (optional) |

## Development

```bash
git clone https://github.com/nabheet/pcbway-mcp-server.git
cd pcbway-mcp-server
npm install
npm run build
```

## Architecture

```
src/
├── index.ts                  # MCP server entry point + tool registry
├── config.ts                 # Environment variable loading (PCBWAY_API_KEY only)
├── client.ts                 # Simple api-key auth, POST-only client
├── types.ts                  # Full TypeScript interfaces matching PCBWay API
└── resources/
    ├── PcbQuote.ts           # POST /api/Pcb/PcbQuotation
    ├── SmtQuote.ts           # POST /api/SMT/SMTQuotation
    ├── OrderProcess.ts       # POST /api/Pcb/QueryOrderProcess
    ├── OrderDetails.ts       # POST /api/Pcb/CheckOrderDetails
    ├── Shipping.ts           # POST /api/Pcb/GetFreightByOrder
    ├── Account.ts            # POST /api/Account/QueryBalance
    ├── PlaceOrder.ts         # POST /api/Pcb/PlaceOrder
    ├── ConfirmOrder.ts       # POST /api/Pcb/ConfirmOrder
    ├── CancelOrder.ts        # POST /api/Pcb/CancelOrder
    ├── CheckTGroupOrder.ts   # POST /api/Pcb/CheckTGroupOrder
    ├── PayTGroupOrder.ts     # POST /api/Pcb/PayTGroupOrder
    ├── CancelTGroupOrder.ts  # POST /api/Pcb/CancelTGroupOrder
    ├── CheckGroupOrder.ts    # POST /api/Pcb/CheckGroupOrder
    ├── GetCountries.ts       # POST /api/Address/GetCountry
    ├── GetStates.ts          # POST /api/Address/GetState
    └── GetCities.ts          # POST /api/Address/GetCity
```

One class per resource. Input validation via Zod schemas. All endpoints use POST with JSON body and `api-key` header authentication.

## API Endpoint Coverage

| MCP Tool | PCBWay API Endpoint | Status |
|---|---|---|
| `pcb_quote` | `POST /api/Pcb/PcbQuotation` | ✅ |
| `smt_quote` | `POST /api/SMT/SMTQuotation` | ✅ |
| `order_process` | `POST /api/Pcb/QueryOrderProcess` | ✅ |
| `order_details` | `POST /api/Pcb/CheckOrderDetails` | ✅ |
| `shipping_freight` | `POST /api/Pcb/GetFreightByOrder` | ✅ |
| `place_order` | `POST /api/Pcb/PlaceOrder` | ✅ |
| `confirm_order` | `POST /api/Pcb/ConfirmOrder` | ✅ |
| `cancel_order` | `POST /api/Pcb/CancelOrder` | ✅ |
| `check_tgroup_order` | `POST /api/Pcb/CheckTGroupOrder` | ✅ |
| `pay_tgroup_order` | `POST /api/Pcb/PayTGroupOrder` | ✅ |
| `cancel_tgroup_order` | `POST /api/Pcb/CancelTGroupOrder` | ✅ |
| `check_group_order` | `POST /api/Pcb/CheckGroupOrder` | ✅ |
| `account_balance` | `POST /api/Account/QueryBalance` | ✅ |
| `get_countries` | `POST /api/Address/GetCountry` | ✅ |
| `get_states` | `POST /api/Address/GetState` | ✅ |
| `get_cities` | `POST /api/Address/GetCity` | ✅ |

## License

MIT
