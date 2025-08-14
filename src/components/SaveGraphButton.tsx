import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { graphService } from '../lib/graphService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface SaveGraphButtonProps {
  graphData: any; // Your graph data structure
  existingGraphId?: string;
  className?: string;
}

const SaveGraphButton: React.FC<SaveGraphButtonProps> = ({ 
  graphData, 
  existingGraphId,
  className = ""
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false
  });

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save your graph.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your graph.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const graphId = await graphService.saveGraph(user.uid, {
        id: existingGraphId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        graphData,
        isPublic: formData.isPublic,
      });

      toast({
        title: "Graph saved successfully!",
        description: existingGraphId ? "Your graph has been updated." : "Your graph has been saved.",
      });

      setIsOpen(false);
      setFormData({ title: '', description: '', isPublic: false });
    } catch (error) {
      console.error('Error saving graph:', error);
      toast({
        title: "Error saving graph",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Button 
        variant="outline" 
        className={className}
        onClick={() => {
          toast({
            title: "Sign in required",
            description: "Please sign in to save your graphs.",
            variant: "destructive",
          });
        }}
      >
        Save Graph
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          {existingGraphId ? 'Update Graph' : 'Save Graph'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingGraphId ? 'Update Graph' : 'Save Graph'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              id="title"
              type="text"
              placeholder="Enter graph title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Enter graph description (optional)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              id="isPublic"
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Make this graph public (others can view it)
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.title.trim()}
          >
            {saving ? 'Saving...' : (existingGraphId ? 'Update' : 'Save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveGraphButton;
