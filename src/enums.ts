// ── ShipType ──────────────────────────────────────────────────────

/** Freight_ShipType values */
export const SHIP_TYPES = {
  DHL: 1,
  FedEx_IP: 10,
  FedExFICP: 25,
  SF_Express: 4,
  Freight_Collect_Account: 5,
  EMS: 6,
  E_packet: 7,
  China_Post: 9,
  Global_Standard_Shipping: 35,
} as const;

export type ShipType = (typeof SHIP_TYPES)[keyof typeof SHIP_TYPES];

// ── PayType ──────────────────────────────────────────────────────

/** Pcb_PayType values */
export const PAY_TYPES = {
  AccountPay: 1,
  PCBWayWebPay: 2,
} as const;

export type PayType = (typeof PAY_TYPES)[keyof typeof PAY_TYPES];
