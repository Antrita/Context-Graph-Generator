import React, { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { useSavedGraphs } from '../hooks/useSavedGraphs';
import { format } from 'date-fns';

interface SavedGraphsProps {
  onLoadGraph?: (graphData: any, graphId: string) => void;
}

const SavedGraphs: React.FC<SavedGraphsProps> = ({ onLoadGraph }) => {
  const { user } = useAuth();
  const { graphs, loading, error } = useSavedGraphs();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (graphId: string) => {
    try {
      await deleteDoc(doc(db, 'graphs', graphId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting graph:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Saved Graphs</h2>
        <p className="text-sm text-gray-500 mt-1">
          {graphs.length} {graphs.length === 1 ? 'graph' : 'graphs'} saved
        </p>
      </div>

      {graphs.length === 0 ? (
        <div className="p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No graphs yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start by creating your first context graph.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {graphs.map((graph) => (
            <div key={graph.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {graph.title}
                  </h3>
                  {graph.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {graph.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                    <span>Created {formatDate(graph.createdAt)}</span>
                    <span>•</span>
                    <span>Updated {formatDate(graph.updatedAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      if (onLoadGraph) {
                        onLoadGraph(graph.graphData, graph.id!);
                      }
                    }}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Load
                  </button>
                  
                  <button
                    onClick={() => setDeleteConfirm(graph.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Graph
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this graph? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedGraphs;
