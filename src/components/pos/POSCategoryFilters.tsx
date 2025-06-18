import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCategories } from '@/lib/storage';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Failed to load product categories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Handle selecting a category
  const handleCategorySelect = (categoryId: number | null) => {
    onCategoryChange(categoryId);
  };  if (loading) {
    return (
      <div className="mb-4">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 w-max">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton 
                key={i} 
                className="h-8 w-24 flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 min-w-0 w-full">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2 w-max">
          <Button
            variant={selectedCategoryId === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategorySelect(null)}
            className="whitespace-nowrap flex-shrink-0"
          >
            All Products
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategorySelect(category.id)}
              className="whitespace-nowrap flex-shrink-0"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default POSCategoryFilters;
