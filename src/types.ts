export type Category = 'forex' | 'crypto' | 'index';
export type Asset = {
  id: string;
  name: string;
  ticker: string;
  category: Category;
  currency: string;
  source: string;
  sourceUrl?: string;
  detail: string;
  color: string;
};
export type PricePoint = { at: string; value: number };
export type PriceBook = {
  version: number;
  updatedAt: string | null;
  series: Record<string, PricePoint[]>;
};
