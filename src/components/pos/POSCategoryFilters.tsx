import React, { useEffect, useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
  }
  return (
    <div className="mb-4">
      <ToggleGroup 
        type="single" 
        value={selectedCategoryId?.toString() || "all"}
        onValueChange={(value) => {
          if (value === "all") {
            onCategoryChange(null);
          } else if (value) {
            onCategoryChange(parseInt(value));
          }
        }}
        className="justify-start overflow-x-auto flex-nowrap"
      >
        <ToggleGroupItem value="all" className="whitespace-nowrap">
          All Products
        </ToggleGroupItem>
        
        {categories.map((category) => (
          <ToggleGroupItem 
            key={category.id} 
            value={category.id.toString()}
            className="whitespace-nowrap"
          >
            {category.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default POSCategoryFilters;
