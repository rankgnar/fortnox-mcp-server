// Fortnox API response types

export interface MetaInformation {
  "@CurrentPage": number;
  "@TotalPages": number;
  "@TotalResources": number;
}

export interface FortnoxListResponse<T> {
  MetaInformation: MetaInformation;
  [key: string]: T[] | MetaInformation | unknown;
}

export interface FortnoxError {
  ErrorInformation: {
    error: number;
    message: string;
    code: number;
  };
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface SupplierInvoice {
  GivenNumber: string;
  SupplierNumber: string;
  SupplierName: string;
  InvoiceNumber: string;
  InvoiceDate: string;
  DueDate: string;
  Total: number;
  Balance: number;
  Currency: string;
  CurrencyRate: number;
  CurrencyUnit: number;
  Booked: boolean;
  Cancelled: boolean;
  Credit: boolean;
  Account: number;
  Project: string;
  CostCenter: string;
  PaymentPending: boolean;
  RoundingValue: number;
  AuthorizerName: string;
  FinalPayDate: string;
  SupplierInvoiceRows: SupplierInvoiceRow[];
  "@url": string;
}

export interface SupplierInvoiceRow {
  Account: number;
  Amount: number;
  Code: string;
  CostCenter: string;
  Debit: number;
  Credit: number;
  Project: string;
  ArticleNumber: string;
  ItemDescription: string;
  Quantity: number;
  Price: number;
}

export interface SupplierInvoicePayment {
  Number: number;
  Amount: number;
  AmountCurrency: number;
  Booked: boolean;
  Currency: string;
  CurrencyRate: number;
  CurrencyUnit: number;
  InvoiceNumber: string;
  PaymentDate: string;
  Source: string;
  "@url": string;
}

export interface Supplier {
  SupplierNumber: string;
  Name: string;
  Address1: string;
  Address2: string;
  ZipCode: string;
  City: string;
  Country: string;
  CountryCode: string;
  Email: string;
  Phone1: string;
  Phone2: string;
  OrganisationNumber: string;
  BankAccountNumber: string;
  BG: string;
  PG: string;
  BIC: string;
  IBAN: string;
  Currency: string;
  Active: boolean;
  "@url": string;
}

export interface Invoice {
  DocumentNumber: string;
  CustomerNumber: string;
  CustomerName: string;
  InvoiceDate: string;
  DueDate: string;
  Total: number;
  Balance: number;
  Currency: string;
  Booked: boolean;
  Cancelled: boolean;
  Sent: boolean;
  NoxFinans: boolean;
  OCR: string;
  Project: string;
  FinalPayDate: string;
  InvoiceRows: InvoiceRow[];
  "@url": string;
}

export interface InvoiceRow {
  AccountNumber: number;
  ArticleNumber: string;
  Description: string;
  DeliveredQuantity: number;
  Price: number;
  Total: number;
  Unit: string;
  VAT: number;
}

export interface InvoicePayment {
  Number: number;
  Amount: number;
  AmountCurrency: number;
  Booked: boolean;
  Currency: string;
  InvoiceNumber: number;
  PaymentDate: string;
  Source: string;
  "@url": string;
}

export interface Article {
  ArticleNumber: string;
  Description: string;
  EAN: string;
  PurchasePrice: number;
  SalesPrice: number;
  QuantityInStock: number;
  StockValue: number;
  Unit: string;
  SupplierNumber: string;
  Manufacturer: string;
  Active: boolean;
  "@url": string;
}

export interface CompanyInformation {
  CompanyName: string;
  OrganizationNumber: string;
  Address: string;
  ZipCode: string;
  City: string;
  Country: string;
  CountryCode: string;
  Email: string;
  Phone1: string;
  DatabaseNumber: string;
  VisitAddress: string;
  VisitCity: string;
  VisitZipCode: string;
}
