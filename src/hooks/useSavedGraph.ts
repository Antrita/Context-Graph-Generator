// src/hooks/useSavedGraphs.ts
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

export interface SavedGraph {
  id: string;
  title: string;
  description?: string;
  graphData: any;
  createdAt: any;
  updatedAt: any;
  isPublic?: boolean;
  tags?: string[];
}

export const useSavedGraphs = () => {
  const { user } = useAuth();
  const [graphs, setGraphs] = useState<SavedGraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setGraphs([]);
      setLoading(false);
      return;
    }

    const graphsRef = collection(db, 'graphs');
    const q = query(
      graphsRef,
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const graphsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedGraph[];
      
      setGraphs(graphsData);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('Error fetching graphs:', error);
      setError('Failed to load saved graphs');
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return { graphs, loading, error };
};
