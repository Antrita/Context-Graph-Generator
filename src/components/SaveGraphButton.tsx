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
            {existingGraphId ? '
