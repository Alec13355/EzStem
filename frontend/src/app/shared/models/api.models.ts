export interface Item {
  id: string;
  name: string;
  description?: string;
  costPerStem: number;
  imageUrl?: string;
  notes?: string;
  vendorId?: string;
  vendor?: Vendor;
  isSeasonalItem?: boolean;
  seasonalStartMonth?: number;
  seasonalEndMonth?: number;
  leadTimeDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactEmail?: string;
  notes?: string;
}

export interface RecipeItem {
  id: string;
  recipeId: string;
  itemId: string;
  item?: Item;
  quantity: number;
  costPerStem: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  laborCost: number;
  recipeItems: RecipeItem[];
  createdAt: string;
  totalCost?: number;
}

export interface FloristEvent {
  id: string;
  name: string;
  eventDate: string;
  clientName?: string;
  notes?: string;
  status: 'Draft' | 'Confirmed' | 'Ordered' | 'Completed';
  eventRecipes: EventRecipe[];
  createdAt: string;
}

export interface EventRecipe {
  id: string;
  eventId: string;
  recipeId: string;
  recipe?: Recipe;
  quantity: number;
}

export interface OrderLineItem {
  id: string;
  orderId: string;
  itemId: string;
  item?: Item;
  vendorId?: string;
  vendor?: Vendor;
  quantityNeeded: number;
  quantityOrdered: number;
  costPerUnit: number;
}

export interface Order {
  id: string;
  eventId: string;
  status: 'Draft' | 'Submitted' | 'Confirmed' | 'Received';
  lineItems: OrderLineItem[];
  wastePercentage?: number;
  wasteCalculationDate?: string;
  createdAt: string;
}

export interface PricingResult {
  stemCost: number;
  laborCost: number;
  totalCost: number;
  markup: number;
  retailPrice: number;
  profitMargin: number;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface PricingConfig {
  id: string;
  defaultMarkupPercentage: number;
  defaultLaborRate: number;
}

export interface RecipePricing {
  recipeId: string;
  recipeName: string;
  itemsCost: number;
  laborCost: number;
  totalCost: number;
  quantity: number;
}

export interface EventSummary {
  eventId: string;
  eventName: string;
  totalItemsCost: number;
  totalLaborCost: number;
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  recipes: RecipePricing[];
}

export interface VendorOrderGroup {
  vendorId: string;
  vendorName: string;
  lineItems: OrderLineItem[];
  totalCost: number;
}

export interface WasteSummary {
  totalStemsOrdered: number;
  totalStemsUsed: number;
  wastePercentage: number;
  wasteCategory: 'Low' | 'Medium' | 'High';
}
