import { supabase } from "./supabase";

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  userId?: string;
}

export const saveHistoryToSupabase = async (userId: string, item: Omit<HistoryItem, 'id' | 'userId'>) => {
  // Local storage fallback for Demo/Mock Mode or missing config
  if (userId.startsWith('guest_') || userId.startsWith('mock_')) {
    const localHistory = JSON.parse(localStorage.getItem('smart_calc_history') || '[]');
    const newItem = { id: Math.random().toString(36).substr(2, 9), ...item, userId };
    localStorage.setItem('smart_calc_history', JSON.stringify([newItem, ...localHistory].slice(0, 50)));
    return newItem.id;
  }

  try {
    const { data, error } = await supabase
      .from('history')
      .insert([
        {
          ...item,
          userId,
          timestamp: new Date().toISOString() // Supabase works best with ISO strings or timestamptz
        }
      ])
      .select();

    if (error) throw error;
    return data?.[0]?.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    return null;
  }
};

export const fetchHistoryFromSupabase = async (userId: string) => {
  if (userId.startsWith('guest_') || userId.startsWith('mock_')) {
    const localHistory = JSON.parse(localStorage.getItem('smart_calc_history') || '[]');
    return localHistory.filter((h: any) => h.userId === userId);
  }

  try {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('userId', userId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    // Map data to match HistoryItem interface if needed
    return (data || []).map(item => ({
        ...item,
        timestamp: new Date(item.timestamp).getTime()
    })) as HistoryItem[];
  } catch (error) {
    console.error("Error fetching history: ", error);
    return [];
  }
};

export const clearUserHistory = async (userId: string) => {
    if (userId.startsWith('guest_') || userId.startsWith('mock_')) {
        localStorage.removeItem('smart_calc_history');
        return;
    }
    try {
        const { error } = await supabase
            .from('history')
            .delete()
            .eq('userId', userId);
        
        if (error) throw error;
    } catch (error) {
        console.error("Error clearing history: ", error);
    }
}

