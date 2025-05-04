import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { getBusinessSettings, BusinessLocation } from '../../services/businessSettings';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import { saveSelectedLocation } from '../../services/locationService';

const BusinessLocationSelector = () => {
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { cart, setLocation } = useCart();
  
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const settings = await getBusinessSettings(true); // Force refresh to get latest
        if (settings && settings.locations) {
          // Filter only active locations
          const activeLocations = settings.locations.filter(loc => loc.is_active === 1);
          setLocations(activeLocations);

          // Check if current location exists in active locations
          const locationExists = activeLocations.some(loc => loc.id === cart.location_id);

          // If no location selected or current location not in active list, select first one
          if (activeLocations.length > 0 && !locationExists) {
            const firstLocation = activeLocations[0];
            setLocation(firstLocation.id);
            saveSelectedLocation(firstLocation.id);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading business locations:', error);
        toast.error('Failed to load business locations');
        setLoading(false);
      }
    };
    
    loadLocations();
  }, []);
  
  const handleLocationChange = (locationId: string) => {
    const numericId = parseInt(locationId, 10);
    if (!isNaN(numericId)) {
      setLocation(numericId);
      // Also store in localStorage for persistence
      saveSelectedLocation(numericId);
      
      toast.success('Business location updated');
    }
  };
  
  const getCurrentLocationName = () => {
    const location = locations.find(loc => loc.id === cart.location_id);
    return location ? location.name : 'Unknown location';
  };
  
  // Format address from individual fields
  const getFormattedAddress = (location: BusinessLocation | undefined) => {
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
  
  const currentLocation = locations.find(loc => loc.id === cart.location_id);
  const formattedAddress = getFormattedAddress(currentLocation);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-sadiid-600" />
          Business Location
        </CardTitle>
        <CardDescription>Select your current business location</CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={cart.location_id?.toString() || ''}
          onValueChange={handleLocationChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map(location => (
              <SelectItem key={location.id} value={location.id.toString()}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {currentLocation && (
          <div className="mt-4 text-sm text-gray-500">
            <div className="font-medium">{currentLocation.name}</div>
            {formattedAddress && <div className="mt-1">{formattedAddress}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessLocationSelector;