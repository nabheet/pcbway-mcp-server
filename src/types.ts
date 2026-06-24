/**
 * Shared types for the PCBWay Partner API.
 * Mirrors the real API at https://api-partner.pcbway.com/Help
 *
 * Enums (SHIP_TYPES, PAY_TYPES) live in ./enums.ts
 */

// ── Shared sub-types ────────────────────────────────────────────────

export interface PcbDataPriceItem {
  BuildDays: number;
  BuildText: string;
  Express: boolean;
  Price: number;
  Standard: boolean;
}

export interface ShippingModel {
  ShipCost: number;
  ShipDays: string;
  Weight: number;
  IsRas: boolean;
}

export interface PcbOrderProcessModel {
  Name: string;
  Time: string; // ISO 8601 date
}

// ── PCB Quotation ───────────────────────────────────────────────────

export interface PcbQuotationRequest {
  Country: string;
  CountryCode: string;
  ShipType: number;
  Postalcode: string;
  City: string;
  cxipt?: string | null;
  cxiptselectiveGold?: string | null;
  cxiptselectiveHold?: string | null;
  cxiptselectiveGoldHold?: string | null;
  BoardType: string;
  XoutAllowance?: string | null;
  EdgeRails?: string | null;
  EdgeRailsContent?: string | null;
  RouteProcess?: string;
  PinBanNum?: number;
  DesignInPanel: number;
  Length: number;
  Width: number;
  Qty: number;
  Layers: number;
  CopperLayer?: string | null;
  CopperSolderMask?: string | null;
  CopperSilkscreen?: string | null;
  Material: string;
  FR4Tg: string;
  TCE?: string | null;
  Rogers?: string | null;
  Thickness: number;
  MinTrackSpacing: string;
  MinHoleSize: number;
  SolderMask: string;
  Silkscreen: string;
  SilkSides: number;
  Goldfingers: string;
  GoldFingersBevelling?: string | null;
  GoldPlatingType?: string | null;
  GoldThickness?: string | null;
  GoldThicknessSelective?: string | null;
  SurfaceFinish: string;
  ViaProcess: string;
  FinishedCopper: string;
  RemoveProductNo: string;
  InsideThickness?: string | null;
  BoardThickness?: string | null;
  AUGoldThickness?: string | null;
  NiGoldThickness?: string | null;
  SendAUGoldThickness?: string | null;
  SendNiGoldThickness?: string | null;
  SendPdAUGoldThickness?: string | null;
  SendPdNiGoldThickness?: string | null;
  SendPdPdGoldThickness?: string | null;
  AuHoldSelective?: string | null;
  NiHoldSelective?: string | null;
  GoldHoldSelective?: string | null;
  AuGoldHoldSelective?: string | null;
  NiGoldHoldSelective?: string | null;
  GoldFingerThickness?: string | null;
  PdAUGoldThickness?: string | null;
  PdNiGoldThickness?: string | null;
  PdPdGoldThickness?: string | null;
  Note?: string | null;
  StructureMCPCB?: string | null;
  AllowENIG?: string | null;
  DateCode?: string | null;
  DataCodeDes?: string | null;
  PlatedHalfHole?: string | null;
  PeelableSoldermask?: string | null;
  ThermoelectricSeparation?: string | null;
  ImpedanceControl?: string | null;
  ViaPadOrViaResin?: string | null;
  ViaPadNew?: string | null;
  Buriedblind?: string | null;
  Viafilled?: string | null;
  ECopperPCB?: string | null;
  EResistorPCB?: string | null;
  CavityPCB?: string | null;
  SemiFlexPCB?: string | null;
  WPHybridPCB?: string | null;
  BackplanePCB?: string | null;
  LeadlessHardGold?: string | null;
  HoleCopperThickness?: string | null;
  ULMaker?: string | null;
  PaperBetweenPCBs?: string | null;
  AddSerialNumbers?: string | null;
  PackageBox?: string | null;
  SidePlating?: string | null;
  CarbonMask?: string | null;
  CustomStackup?: string | null;
  Countersink?: string | null;
  HalogenFree?: string | null;
  BlackFR4blackcore?: string | null;
  Pressfitholes?: string | null;
  AcceptHASLUp?: string | null;
  Zaxis?: string | null;
}

export interface PcbQuotationResponse {
  priceList: PcbDataPriceItem[];
  Shipping: ShippingModel;
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── SMT Quotation ───────────────────────────────────────────────────

export interface SmtQuotationRequest {
  Country: string;
  CountryCode: string;
  ShipType: number;
  Postalcode: string;
  City: string;
  FlexibleOption: string;
  BoardType: string;
  AssemblySide: string;
  Qty: number;
  UniqueParts: number;
  SMTParts: number;
  HoleParts: number;
}

export interface SmtQuotationResponse {
  priceList: PcbDataPriceItem[];
  Shipping: ShippingModel;
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Query Order Process ─────────────────────────────────────────────

export interface QueryOrderProcessRequest {
  OrderNo: string;
}

export interface QueryOrderProcessResponse {
  AllProcess: string[];
  List: PcbOrderProcessModel[];
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Check Order Details ─────────────────────────────────────────────

export interface CheckOrderDetailsRequest {
  OrderNo: string;
}

export interface PcbModelComplex {
  GroupNo: string;
  Status: number;
  IsPaid: boolean;
  Price: number;
  FileUrl: string;
  FileName: string;
  Note: string;
  BuildDays: number;
  DeliveryDate: string;
  AuditResult: string;
  cxipt: string;
  cxiptselectiveGold: string;
  cxiptselectiveHold: string;
  cxiptselectiveGoldHold: string;
  BoardType: string;
  XoutAllowance: string;
  EdgeRails: string;
  EdgeRailsContent: string;
  RouteProcess: string;
  PinBanNum: number;
  DesignInPanel: number;
  Length: number;
  Width: number;
  Qty: number;
  Layers: number;
  CopperLayer: string;
  CopperSolderMask: string;
  CopperSilkscreen: string;
  Material: string;
  FR4Tg: string;
  TCE: string;
  Rogers: string;
  Thickness: number;
  MinTrackSpacing: string;
  MinHoleSize: number;
  SolderMask: string;
  Silkscreen: string;
  SilkSides: number;
  Goldfingers: string;
  GoldFingersBevelling: string;
  GoldPlatingType: string;
  GoldThickness: string;
  GoldThicknessSelective: string;
  SurfaceFinish: string;
  ViaProcess: string;
  FinishedCopper: string;
  RemoveProductNo: string;
  InsideThickness: string;
  BoardThickness: string;
  AUGoldThickness: string;
  NiGoldThickness: string;
  SendAUGoldThickness: string;
  SendNiGoldThickness: string;
  SendPdAUGoldThickness: string;
  SendPdNiGoldThickness: string;
  SendPdPdGoldThickness: string;
  AuHoldSelective: string;
  NiHoldSelective: string;
  GoldHoldSelective: string;
  AuGoldHoldSelective: string;
  NiGoldHoldSelective: string;
  GoldFingerThickness: string;
  PdAUGoldThickness: string;
  PdNiGoldThickness: string;
  PdPdGoldThickness: string;
  StructureMCPCB: string;
  AllowENIG: string;
  DateCode: string;
  DataCodeDes: string;
  PlatedHalfHole: string;
  PeelableSoldermask: string;
  ThermoelectricSeparation: string;
  ImpedanceControl: string;
  ViaPadOrViaResin: string;
  ViaPadNew: string;
  Buriedblind: string;
  Viafilled: string;
  ECopperPCB: string;
  EResistorPCB: string;
  CavityPCB: string;
  SemiFlexPCB: string;
  WPHybridPCB: string;
  BackplanePCB: string;
  LeadlessHardGold: string;
  HoleCopperThickness: string;
  ULMaker: string;
  PaperBetweenPCBs: string;
  AddSerialNumbers: string;
  PackageBox: string;
  SidePlating: string;
  CarbonMask: string;
  CustomStackup: string;
  Countersink: string;
  HalogenFree: string;
  BlackFR4blackcore: string;
  Pressfitholes: string;
  AcceptHASLUp: string;
  Zaxis: string;
}

export interface CheckOrderDetailsResponse {
  PcbModel: PcbModelComplex;
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Get Freight By Order ────────────────────────────────────────────

export interface GetFreightByOrderRequest {
  OrderNo: string;
  AddGroupNo?: string | null;
  ShipType?: number | null;
  Country?: string | null;
  CountryCode?: string | null;
  State?: string | null;
  Postalcode?: string | null;
  City?: string | null;
}

export interface GetFreightByOrderResponse {
  Days: string;
  Price: number;
  IsRas: boolean;
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Place Order ─────────────────────────────────────────────────────

export interface PlaceOrderRequest {
  DataZipFile?: string | null;
  PcbFileUrl?: string | null;
  PcbFileName: string;
  Note?: string | null;
  BuildDays: number;
  BuyerEmail?: string | null;
  PONumber?: string | null;
  HopeCash?: string | null;
  cxipt?: string | null;
  cxiptselectiveGold?: string | null;
  cxiptselectiveHold?: string | null;
  cxiptselectiveGoldHold?: string | null;
  BoardType: string;
  XoutAllowance?: string | null;
  EdgeRails?: string | null;
  EdgeRailsContent?: string | null;
  RouteProcess?: string;
  PinBanNum?: number;
  DesignInPanel: number;
  Length: number;
  Width: number;
  Qty: number;
  Layers: number;
  CopperLayer?: string | null;
  CopperSolderMask?: string | null;
  CopperSilkscreen?: string | null;
  Material: string;
  FR4Tg: string;
  TCE?: string | null;
  Rogers?: string | null;
  Thickness: number;
  MinTrackSpacing: string;
  MinHoleSize: number;
  SolderMask: string;
  Silkscreen: string;
  SilkSides: number;
  Goldfingers: string;
  GoldFingersBevelling?: string | null;
  GoldPlatingType?: string | null;
  GoldThickness?: string | null;
  GoldThicknessSelective?: string | null;
  SurfaceFinish: string;
  ViaProcess: string;
  FinishedCopper: string;
  RemoveProductNo: string;
  InsideThickness?: string | null;
  BoardThickness?: string | null;
  AUGoldThickness?: string | null;
  NiGoldThickness?: string | null;
  SendAUGoldThickness?: string | null;
  SendNiGoldThickness?: string | null;
  SendPdAUGoldThickness?: string | null;
  SendPdNiGoldThickness?: string | null;
  SendPdPdGoldThickness?: string | null;
  AuHoldSelective?: string | null;
  NiHoldSelective?: string | null;
  GoldHoldSelective?: string | null;
  AuGoldHoldSelective?: string | null;
  NiGoldHoldSelective?: string | null;
  GoldFingerThickness?: string | null;
  PdAUGoldThickness?: string | null;
  PdNiGoldThickness?: string | null;
  PdPdGoldThickness?: string | null;
  StructureMCPCB?: string | null;
  AllowENIG?: string | null;
  DateCode?: string | null;
  DataCodeDes?: string | null;
  PlatedHalfHole?: string | null;
  PeelableSoldermask?: string | null;
  ThermoelectricSeparation?: string | null;
  ImpedanceControl?: string | null;
  ViaPadOrViaResin?: string | null;
  ViaPadNew?: string | null;
  Buriedblind?: string | null;
  Viafilled?: string | null;
  ECopperPCB?: string | null;
  EResistorPCB?: string | null;
  CavityPCB?: string | null;
  SemiFlexPCB?: string | null;
  WPHybridPCB?: string | null;
  BackplanePCB?: string | null;
  LeadlessHardGold?: string | null;
  HoleCopperThickness?: string | null;
  ULMaker?: string | null;
  PaperBetweenPCBs?: string | null;
  AddSerialNumbers?: string | null;
  PackageBox?: string | null;
  SidePlating?: string | null;
  CarbonMask?: string | null;
  CustomStackup?: string | null;
  Countersink?: string | null;
  HalogenFree?: string | null;
  BlackFR4blackcore?: string | null;
  Pressfitholes?: string | null;
  AcceptHASLUp?: string | null;
  Zaxis?: string | null;
}

export interface PlaceOrderResponse {
  OrderNo: string;
  DeliveryDate: string;
  Price: number;
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Confirm Order ───────────────────────────────────────────────────

export interface ConfirmOrderRequest {
  OrderNo: string;
  PayType: number;
  AddGroupNo?: string | null;
  ShipType?: number | null;
  Country?: string | null;
  CountryCode?: string | null;
  State?: string | null;
  Postalcode?: string | null;
  City?: string | null;
  Addr?: string | null;
  CompanyName?: string | null;
  ContactName?: string | null;
  Tel?: string | null;
  BuyerEmail?: string | null;
  Tax?: string | null;
}

export interface ConfirmOrderResponse {
  DeliveryDate: string | null;
  GroupNo: string | null;
  TGroupNo: string | null;
  TotalAmount: number;
  AccountBalance: number;
  PayType: number;
  PCBWayPayUrl: string | null;
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Cancel Order ────────────────────────────────────────────────────

export interface CancelOrderRequest {
  OrderNo: string;
}

export interface CancelOrderResponse {
  OrderNo: string;
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Query Balance ───────────────────────────────────────────────────

export interface QueryBalanceResponse {
  balance: number;
  coupon: number;
  point: number;
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Check TGroup Order ──────────────────────────────────────────────

export interface CheckTGroupOrderRequest {
  TGroupNo: string;
}

export interface TGroupOrderModel {
  CreateTime: string;
  TGroupNo: string;
  AddGroupNo: string;
  TotalMoney: number;
  FeePaypal: number;
  ShipMoney: number;
  Tax: string;
  ShipType: number;
  Country: string;
  State: string;
  Postalcode: string;
  City: string;
  Addr: string;
  CompanyName: string;
  ContactName: string;
  Tel: string;
}

export interface CheckTGroupOrderResponse {
  TGroupOrder: TGroupOrderModel;
  OrderList: PcbModelComplex[];
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Pay TGroup Order ─────────────────────────────────────────────────

export interface PayTGroupOrderRequest {
  TGroupNo: string;
  PayType: number;
}

export interface PayTGroupOrderResponse {
  DeliveryDate: string | null;
  GroupNo: string | null;
  TGroupNo: string | null;
  TotalAmount: number;
  AccountBalance: number;
  PayType: number;
  PCBWayPayUrl: string | null;
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Cancel TGroup Order ──────────────────────────────────────────────

export interface CancelTGroupOrderRequest {
  TGroupNo: string;
}

export interface CancelTGroupOrderResponse {
  TGroupNo: string;
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Check Group Order ────────────────────────────────────────────────

export interface CheckGroupOrderRequest {
  GroupNo: string;
}

export interface GroupOrderModel {
  CreateTime: string;
  GroupNo: string;
  TotalMoney: number;
  FeePaypal: number;
  ShipMoney: number;
  Tax: string;
  ShipType: number;
  Country: string;
  State: string;
  Postalcode: string;
  City: string;
  Addr: string;
  CompanyName: string;
  ContactName: string;
  Tel: string;
}

export interface CheckGroupOrderResponse {
  GroupOrder: GroupOrderModel;
  OrderList: PcbModelComplex[];
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Address / GetCountry ─────────────────────────────────────────────

export interface AddressCountryModel {
  Country: string;
  CountryCode: string;
}

export interface GetCountryResponse {
  Countrys: AddressCountryModel[];
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Address / GetState ───────────────────────────────────────────────

export interface GetStateRequest {
  Country: string;
  CountryCode: string;
}

export interface GetStateResponse {
  States: string[];
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}

// ── Address / GetCity ────────────────────────────────────────────────

export interface GetCityRequest {
  Country: string;
  CountryCode: string;
  State?: string | null;
}

export interface AddressCityModel {
  Postalcode: string;
  City: string;
}

export interface GetCityResponse {
  Citys: AddressCityModel[];
  Status: 'ok' | 'error';
  ErrorText: string | null;
  Code: number;
}
