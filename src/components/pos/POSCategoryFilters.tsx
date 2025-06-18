import React, { useEffect, useState } from 'react';
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
  };
  if (loading) {
    return (
      <div className="py-3 mb-4">
        <div className="flex space-x-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton 
              key={i} 
              className="h-8 w-24 flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }  return (
    <div className="mb-4 w-full min-w-0">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2 w-max">
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 transition-colors ${
              selectedCategoryId === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All Products
          </button>
          
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 transition-colors ${
                selectedCategoryId === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default POSCategoryFilters;
