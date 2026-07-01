import { create } from 'zustand';
import { MenuItem, MenuCategory } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// 🔒 SECURITY: Whitelisted fields that can be written to the dishes table
// Prevents mass assignment of protected fields like view_count, order_count, etc.
const ALLOWED_DISH_FIELDS = [
  'name_ar', 'name_en', 'description_ar', 'description_en',
  'price', 'currency', 'image_url', 'model_3d_url', 'model_3d_status',
  'is_available', 'is_chef_special', 'allergens', 'calories',
  'protein', 'carbs', 'fat', 'prep_time_min', 'sort_order',
  'category_id', 'restaurant_id', 'ai_generation_task_id'
] as const;

/**
 * 🔒 Sanitize dish data to only include allowed fields
 */
function sanitizeDishData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const key of ALLOWED_DISH_FIELDS) {
    if (key in data && data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
}

/**
 * 🔒 Get current user's restaurant_id from their profile
 */
async function getMyRestaurantId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.restaurant_id) {
    throw new Error('Restaurant ID not found in profile');
  }

  return profile.restaurant_id;
}

interface MenuState {
  categories: MenuCategory[];
  branding: any | null;
  loading: boolean;
  fetchMenu: (restaurantId: string) => Promise<void>;
  addItem: (categoryId: string, item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateItem: (categoryId: string, itemId: string, item: Partial<MenuItem>) => Promise<void>;
  deleteItem: (categoryId: string, itemId: string) => Promise<void>;
  addCategory: (restaurantId: string, nameAr: string, nameEn: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: [],
  branding: null,
  loading: false,

  fetchMenu: async (restaurantId) => {
    if (!isSupabaseConfigured) return;
    
    set({ loading: true });
    try {
      // 🔒 RLS will enforce that only owned/public data is returned
      const [restRes, catRes, dishRes] = await Promise.all([
        supabase.from('restaurants').select('branding').eq('id', restaurantId).single(),
        supabase.from('categories').select('*').eq('restaurant_id', restaurantId).order('sort_order', { ascending: true }),
        supabase.from('dishes').select('*').eq('restaurant_id', restaurantId).order('sort_order', { ascending: true })
      ]);

      if (restRes.error) throw restRes.error;
      if (catRes.error) throw catRes.error;
      if (dishRes.error) throw dishRes.error;

      const catData = catRes.data;
      const dishData = dishRes.data;

      const formattedCategories: MenuCategory[] = catData.map(cat => ({
        id: cat.id,
        nameAr: cat.name_ar,
        nameEn: cat.name_en,
        items: dishData
          .filter(dish => dish.category_id === cat.id)
          .map(dish => ({
            id: dish.id,
            nameAr: dish.name_ar,
            nameEn: dish.name_en,
            descriptionAr: dish.description_ar,
            descriptionEn: dish.description_en,
            description: dish.description_ar,
            price: dish.price,
            currency: dish.currency,
            category: dish.category_id,
            image: dish.image_url,
            model3D: dish.model_3d_url,
            model3dStatus: dish.model_3d_status,
            available: dish.is_available,
            snapShares: dish.snap_count || 0,
            calories: dish.calories,
            allergens: dish.allergens,
            isChefSpecial: dish.is_chef_special,
            prepTimeMin: dish.prep_time_min,
            protein: dish.protein,
            carbs: dish.carbs,
            fat: dish.fat,
            aiGenerationTaskId: dish.ai_generation_task_id,
            isAIGenerated: dish.is_ai_generated,
          }))
      }));

      set({ 
        categories: formattedCategories,
        branding: restRes.data.branding
      });
    } catch (error) {
      // 🔒 Don't log sensitive data
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (categoryId, item) => {
    try {
      const restaurantId = await getMyRestaurantId();

      // 🔒 SECURITY: Sanitize — only allow whitelisted fields
      const dishData = sanitizeDishData({
        restaurant_id: restaurantId,
        category_id: categoryId,
        name_ar: item.nameAr,
        name_en: item.nameEn,
        description_ar: item.descriptionAr,
        description_en: item.descriptionEn,
        price: item.price,
        currency: item.currency,
        image_url: item.image,
        model_3d_url: item.model3D,
        is_available: item.available,
      });

      const { error } = await supabase
        .from('dishes')
        .insert([dishData]);

      if (error) throw error;
      
      // Refresh menu
      await get().fetchMenu(restaurantId);
    } catch (error) {
      throw error;
    }
  },

  updateItem: async (categoryId, itemId, updatedItem) => {
    // 🔒 SECURITY: Get restaurant_id and add ownership filter
    const restaurantId = await getMyRestaurantId();

    // 🔒 SECURITY: Sanitize — only allow whitelisted fields
    const updateData = sanitizeDishData({
      name_ar: updatedItem.nameAr,
      name_en: updatedItem.nameEn,
      description_ar: updatedItem.descriptionAr,
      description_en: updatedItem.descriptionEn,
      price: updatedItem.price,
      image_url: updatedItem.image,
      model_3d_url: updatedItem.model3D,
      is_available: updatedItem.available,
    });

    // 🔒 SECURITY: Filter by BOTH id AND restaurant_id to prevent IDOR
    const { error } = await supabase
      .from('dishes')
      .update(updateData)
      .eq('id', itemId)
      .eq('restaurant_id', restaurantId);

    if (error) throw error;

    // Local update for speed
    set((state) => ({
      categories: state.categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, ...updatedItem } : item
              )
            }
          : cat
      )
    }));
  },

  deleteItem: async (categoryId, itemId) => {
    // 🔒 SECURITY: Get restaurant_id and add ownership filter
    const restaurantId = await getMyRestaurantId();

    // 🔒 SECURITY: Filter by BOTH id AND restaurant_id to prevent IDOR
    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', itemId)
      .eq('restaurant_id', restaurantId);

    if (error) throw error;

    set((state) => ({
      categories: state.categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((item) => item.id !== itemId) }
          : cat
      )
    }));
  },

  addCategory: async (restaurantId, nameAr, nameEn) => {
    // 🔒 SECURITY: Verify ownership via getMyRestaurantId
    const myRestaurantId = await getMyRestaurantId();
    
    // 🔒 Ensure user can only add categories to their own restaurant
    if (restaurantId !== myRestaurantId) {
      throw new Error('Unauthorized: Cannot modify another restaurant');
    }

    const { error } = await supabase
      .from('categories')
      .insert([{
        restaurant_id: myRestaurantId,
        name_ar: nameAr.substring(0, 100), // 🔒 Limit length
        name_en: nameEn.substring(0, 100),
      }]);

    if (error) throw error;
    get().fetchMenu(myRestaurantId);
  },

  deleteCategory: async (categoryId) => {
    // 🔒 SECURITY: RLS will enforce ownership, but we add belt-and-suspenders check
    const restaurantId = await getMyRestaurantId();

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('restaurant_id', restaurantId); // 🔒 Ownership filter

    if (error) throw error;

    set((state) => ({
      categories: state.categories.filter((cat) => cat.id !== categoryId)
    }));
  },
}));
