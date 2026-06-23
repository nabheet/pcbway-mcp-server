/**
 * Shared utilities for PCBWay MCP resource handlers.
 *
 * PCB_DEFAULTS eliminates ~40 lines of null-fill boilerplate per resource file.
 * Every PCB request (PcbQuotation, PlaceOrder, etc.) sends the same set of
 * optional advanced fields that must be explicitly set to null / empty / default.
 */

/** Default values for all optional PCB advanced fields. */
export const PCB_DEFAULTS: Record<string, unknown> = {
  // ── Gold / plating fields (always null unless specified) ──────
  cxipt: null,
  cxiptselectiveGold: null,
  cxiptselectiveHold: null,
  cxiptselectiveGoldHold: null,
  XoutAllowance: null,
  EdgeRailsContent: null,
  GoldFingersBevelling: null,
  GoldPlatingType: null,
  GoldThickness: null,
  GoldThicknessSelective: null,
  GoldFingerThickness: null,
  BoardThickness: null,
  AUGoldThickness: null,
  NiGoldThickness: null,
  SendAUGoldThickness: null,
  SendNiGoldThickness: null,
  SendPdAUGoldThickness: null,
  SendPdNiGoldThickness: null,
  SendPdPdGoldThickness: null,
  AuHoldSelective: null,
  NiHoldSelective: null,
  GoldHoldSelective: null,
  AuGoldHoldSelective: null,
  NiGoldHoldSelective: null,
  PdAUGoldThickness: null,
  PdNiGoldThickness: null,
  PdPdGoldThickness: null,

  // ── Process / material fields ─────────────────────────────────
  AllowENIG: null,
  DataCodeDes: null,
  ViaPadOrViaResin: null,
  ViaPadNew: null,
  WPHybridPCB: null,
  LeadlessHardGold: null,
  BlackFR4blackcore: null,
  Pressfitholes: null,
  AcceptHASLUp: null,
  Zaxis: null,

  // ── String fields that must be empty string, not null ──────────
  ThermoelectricSeparation: '',
  Buriedblind: '',
  Viafilled: '',
  PaperBetweenPCBs: '',

  // ── Fields with non-null defaults ──────────────────────────────
  StructureMCPCB: 'middle',
  DateCode: 'None',
  PeelableSoldermask: 'None',
  HoleCopperThickness: 'None',
  ULMaker: 'None',
  PackageBox: 'No',
  RemoveProductNo: 'No',
  AddSerialNumbers: 'None',
  RouteProcess: '--',
  PinBanNum: 0,
  CopperLayer: '--',
  CopperSolderMask: '--',
  CopperSilkscreen: '--',
} as const;
