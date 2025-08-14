import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface GraphData {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  graphData: any; // Your graph structure
  tags?: string[];
  isPublic?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

class GraphService {
  private readonly collectionName = 'graphs';

  // Save a new graph or update existing one
  async saveGraph(userId: string, graphData: Omit<GraphData, 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const graphRef = graphData.id ? doc(db, this.collectionName, graphData.id) : doc(collection(db, this.collectionName));
      
      const data: Partial<GraphData> = {
        ...graphData,
        userId,
        updatedAt: serverTimestamp(),
      };

      // If it's a new graph, add createdAt
      if (!graphData.id) {
        data.createdAt = serverTimestamp();
      }

      await setDoc(graphRef, data, { merge: true });
      return graphRef.id;
    } catch (error) {
      console.error('Error saving graph:', error);
      throw new Error('Failed to save graph');
    }
  }

  // Get a specific graph by ID
  async getGraph(graphId: string, userId: string): Promise<GraphData | null> {
    try {
      const graphRef = doc(db, this.collectionName, graphId);
      const graphSnap = await getDoc(graphRef);

      if (!graphSnap.exists()) {
        return null;
      }

      const data = graphSnap.data() as GraphData;
      
      // Check if user owns this graph or if it's public
      if (data.userId !== userId && !data.isPublic) {
        throw new Error('Access denied');
      }

      return {
        id: graphSnap.id,
        ...data
      };
    } catch (error) {
      console.error('Error fetching graph:', error);
      throw new Error('Failed to fetch graph');
    }
  }

  // Get all graphs for a user
  async getUserGraphs(userId: string): Promise<GraphData[]> {
    try {
      const graphsRef = collection(db, this.collectionName);
      const q = query(
        graphsRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GraphData[];
    } catch (error) {
      console.error('Error fetching user graphs:', error);
      throw new Error('Failed to fetch graphs');
    }
  }

  // Delete a graph
  async deleteGraph(graphId: string, userId: string): Promise<void> {
    try {
      const graphRef = doc(db, this.collectionName, graphId);
      const graphSnap = await getDoc(graphRef);

      if (!graphSnap.exists()) {
        throw new Error('Graph not found');
      }

      const data = graphSnap.data() as GraphData;
      if (data.userId !== userId) {
        throw new Error('Access denied');
      }

      await deleteDoc(graphRef);
    } catch (error) {
      console.error('Error deleting graph:', error);
      throw new Error('Failed to delete graph');
    }
  }

  // Update graph metadata (title, description, tags, etc.)
  async updateGraphMetadata(
    graphId: string, 
    userId: string, 
    updates: Partial<Pick<GraphData, 'title' | 'description' | 'tags' | 'isPublic'>>
  ): Promise<void> {
    try {
      const graphRef = doc(db, this.collectionName, graphId);
      const graphSnap = await getDoc(graphRef);

      if (!graphSnap.exists()) {
        throw new Error('Graph not found');
      }

      const data = graphSnap.data() as GraphData;
      if (data.userId !== userId) {
        throw new Error('Access denied');
      }

      await updateDoc(graphRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating graph metadata:', error);
      throw new Error('Failed to update graph');
    }
  }

  // Get public graphs (for sharing/discovery features)
  async getPublicGraphs(limit: number = 20): Promise<GraphData[]> {
    try {
      const graphsRef = collection(db, this.collectionName);
      const q = query(
        graphsRef,
        where('isPublic', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GraphData[];
    } catch (error) {
      console.error('Error fetching public graphs:', error);
      throw new Error('Failed to fetch public graphs');
    }
  }
}

export const graphService = new GraphService();
