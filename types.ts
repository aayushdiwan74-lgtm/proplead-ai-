export enum Category {
  SUPPLY = 'SUPPLY',
  DEMAND = 'DEMAND'
}

export type MarketCategory = 'Residential' | 'Commercial' | 'Industrial' | 'Plot' | 'Other';

export interface CategoryInsight {
  category: MarketCategory;
  avgPricePerSqFt: number;
  totalLeads: number;
  outliersCount: number;
  notes: string;
}

export interface Lead {
  date: string;
  who: string;
  propertyType: string;
  size: string;
  priceRate: string; 
  locationLink?: string;
  additionalDetails: string;
  location: string;
  phoneNumber: string;
  category: Category;
  ratePerSqFt?: number;
  marketCategory: MarketCategory;
}

export interface PricingIntelligence {
  location: string;
  marketCategory: MarketCategory;
  avgRate: number;
  leadCount: number;
  minPrice: string;
  maxPrice: string;
  trendDirection: 'up' | 'down' | 'stable';
  history?: { date: string; rate: number }[];
}

export interface Analytics {
  topBrokers: { name: string; count: number }[];
  locationPricing: PricingIntelligence[];
  categoryInsights: CategoryInsight[];
  topDemandLocations: { location: string; count: number }[];
  topSupplyLocations: { location: string; count: number }[];
  monthlySummary: {
    monthName: string;
    totalLeads: number;
    supplyPercentage: number;
    demandPercentage: number;
    mostActiveBroker: string;
    propertyBreakdown: Record<string, number>;
  };
  executiveNarrative?: string; 
}

export interface ProcessedMessage {
  timestamp: string;
  sender: string;
  content: string;
  hash: string;
}

export interface ProcessedData {
  id: string;
  timestamp: number;
  leads: Lead[];
  analytics: Analytics;
  processedMessages?: ProcessedMessage[];
}
