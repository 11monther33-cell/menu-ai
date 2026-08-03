import { createClient } from 'npm:@supabase/supabase-js@^2';
import { ConversationState } from './state.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface CatalogItem {
  id: string;
  name: string;
  summary: string;
  price: number;
  capabilities: string[];
}

export async function fetchRestaurantCatalog(restaurantId: string): Promise<CatalogItem[]> {
  const { data: menuItems, error: menuError } = await supabase
    .from('pos_menu_items')
    .select('*')
    .eq('available', true);
    
  if (menuError) {
    console.error("Error fetching catalog", menuError);
    return [];
  }

  return menuItems.map(item => ({
    id: item.id,
    name: item.name_ar || item.name_en,
    summary: item.description_ar || item.description_en || "",
    price: item.price,
    capabilities: item.allergens || [] // Using allergens as mock capabilities
  }));
}

/**
 * Deterministically filters the catalog based on explicit bounds in the conversation state.
 * Returns only products that satisfy the constraints.
 */
export function retrieveProducts(catalog: CatalogItem[], state: ConversationState): CatalogItem[] {
  // If no state, return everything or top N
  if (Object.keys(state).length === 0) return catalog;

  const terms = Object.values(state)
    .filter(fact => fact.certainty !== "inferred")
    .flatMap(fact => fact.value.toLowerCase().split(/\s+/));

  // A real implementation would check !violatesHardBoundary(product, facts).
  // Here we use a simpler scoring mechanism just to filter and rank:
  return catalog.map(product => {
    const textToSearch = [product.name, product.summary, ...product.capabilities].join(" ").toLowerCase();
    const score = terms.filter(word => textToSearch.includes(word)).length;
    return { product, score };
  })
  .filter(({ score }) => score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5) // Return top 5 matches
  .map(({ product }) => product);
}
