import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getCategories } from '@/services/storage';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
}

interface POSCategoryFiltersProps {
  onCategoryChange: (categoryId: number | null) => void;
  selectedCategoryId: number | null;
}

const POSCategoryFilters = ({ onCategoryChange, selectedCategoryId }: POSCategoryFiltersProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        
        // Add "All" category at the beginning
        const allCategories = [
          { id: null, name: 'All' },
          ...(data || [])
        ];
        
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, []);

  if (loading) {
    return <div className="flex gap-2 overflow-x-auto pb-2 mb-4 h-10 animate-pulse bg-gray-100 rounded"></div>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {categories.map((category) => (
        <Button
          key={category.id ?? 'all'}
          variant={category.id === selectedCategoryId ? 'default' : 'outline'}
          className={
            category.id === selectedCategoryId
              ? 'bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap'
              : 'bg-white text-gray-700 whitespace-nowrap'
          }
          onClick={() => onCategoryChange(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};

export default POSCategoryFilters;
