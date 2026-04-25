import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc, 
  limit 
} from "firebase/firestore";
import { db } from "./firebase";

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  userId?: string;
}

export const saveHistoryToFirestore = async (userId: string, item: Omit<HistoryItem, 'id' | 'userId'>) => {
  // Local storage fallback for Demo/Mock Mode or missing config
  if (userId.startsWith('guest_') || userId.startsWith('mock_') || !db) {
    const localHistory = JSON.parse(localStorage.getItem('smart_calc_history') || '[]');
    const newItem = { id: Math.random().toString(36).substr(2, 9), ...item, userId };
    localStorage.setItem('smart_calc_history', JSON.stringify([newItem, ...localHistory].slice(0, 50)));
    return newItem.id;
  }

  try {
    const docRef = await addDoc(collection(db!, "history"), {
      ...item,
      userId,
      timestamp: Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    return null;
  }
};

export const fetchHistoryFromFirestore = async (userId: string) => {
  if (userId.startsWith('guest_') || userId.startsWith('mock_') || !db) {
    const localHistory = JSON.parse(localStorage.getItem('smart_calc_history') || '[]');
    return localHistory.filter((h: any) => h.userId === userId);
  }

  try {
    const q = query(
      collection(db!, "history"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    const history: HistoryItem[] = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() } as HistoryItem);
    });
    return history;
  } catch (error) {
    console.error("Error fetching history: ", error);
    return [];
  }
};

export const clearUserHistory = async (userId: string) => {
    if (userId.startsWith('guest_') || userId.startsWith('mock_') || !db) {
        localStorage.removeItem('smart_calc_history');
        return;
    }
    try {
        const q = query(collection(db!, "history"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db!, "history", d.id)));
        await Promise.all(deletePromises);
    } catch (error) {
        console.error("Error clearing history: ", error);
    }
}
