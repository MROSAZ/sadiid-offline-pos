import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useBusinessSettings } from '@/hooks/repository';

interface POSCategoryFiltersProps {
  onCategoryChange: (categoryId: number | null) => void;
  selectedCategoryId: number | null;
}

interface Category {
  id: number;
  name: string;
}

const POSCategoryFilters: React.FC<POSCategoryFiltersProps> = ({ 
  onCategoryChange,
  selectedCategoryId
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { loading, error, getCategories } = useBusinessSettings();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Failed to load product categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [getCategories]);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  // Handle selecting a category
  const handleCategorySelect = (categoryId: number | null) => {
    onCategoryChange(categoryId);
  };

  if (isLoading || loading) {
    return (
      <div className="py-3 mb-4">
        <div className="flex space-x-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className="h-8 w-24 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
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
