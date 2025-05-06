import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getBusinessSettings } from '@/services/storage';

// Constants
const LOCATION_STORAGE_KEY = 'selected_location_id';

interface BusinessLocation {
  id: number;
  name: string;
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  is_active: number;
}

const BusinessLocationSelector = () => {
  const { cart, setLocation } = useCart();
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Format location address from individual fields
  const formatLocationAddress = (location: BusinessLocation | null): string => {
    if (!location) return '';
    
    const addressParts = [
      location.landmark,
      location.city,
      location.state,
      location.country,
      location.zip_code
    ].filter(Boolean); // Filter out null/undefined/empty values
    
    return addressParts.join(', ');
  };
  
  // Load locations from storage
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);
        const settings = await getBusinessSettings();
        if (settings.locations) {
          const activeLocations = settings.locations.filter(loc => loc.is_active === 1);
          setLocations(activeLocations);
        }
      } catch (error) {
        console.error('Error loading locations:', error);
        toast.error('Failed to load business locations');
      } finally {
        setLoading(false);
      }
    };
    
    loadLocations();
  }, []);
  
  const currentLocation = locations.find(loc => loc.id === cart.location_id);
  const formattedAddress = formatLocationAddress(currentLocation || null);
  
  const handleLocationChange = (locationId: string) => {
    const numericId = parseInt(locationId, 10);
    if (!isNaN(numericId)) {
      // Update cart context
      setLocation(numericId);
      
      // Save to localStorage
      localStorage.setItem(LOCATION_STORAGE_KEY, numericId.toString());
      
      const newLocation = locations.find(loc => loc.id === numericId);
      if (newLocation) {
        toast.success(`Business location set to ${newLocation.name}`);
      }
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Location</CardTitle>
          <CardDescription>Select your primary business location</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-sadiid-600" />
        </CardContent>
      </Card>
    );
  }
  
  if (locations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Location</CardTitle>
          <CardDescription>No business locations available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No business locations were found. Please make sure you have at least one location configured in your business settings.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Location</CardTitle>
        <CardDescription>Select your primary business location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select 
          value={cart.location_id?.toString() || ''}
          onValueChange={handleLocationChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location">
              {currentLocation?.name || 'Select location'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id.toString()}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {currentLocation && (
          <div className="bg-gray-50 p-3 rounded-md text-sm">
            <p className="font-medium text-gray-700">{currentLocation.name}</p>
            {formattedAddress && (
              <p className="text-gray-500 mt-1">{formattedAddress}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessLocationSelector;
