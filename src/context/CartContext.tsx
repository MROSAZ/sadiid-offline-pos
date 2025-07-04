import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { getSelectedLocationId } from '@/services/locationService';

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount: number;
  tax: number;
  total: number;
  variation_id?: number;
}

interface CartState {
  items: CartItem[];
  discount: number;
  tax: number;
  note: string;
  location_id: number | null;
  customer: any | null;
  editingSaleId: string | null;
  editingServerId: number | null; // Server-side ID for synced sales
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_DISCOUNT'; payload: number }
  | { type: 'SET_TAX'; payload: number }
  | { type: 'SET_NOTE'; payload: string }
  | { type: 'SET_LOCATION'; payload: number }
  | { type: 'SET_CUSTOMER'; payload: any | null }
  | { type: 'SET_EDITING_SALE'; payload: string | null }
  | { type: 'SET_EDITING_SERVER_ID'; payload: number | null };

const initialState: CartState = {
  items: [],
  discount: 0,
  tax: 0,
  note: '',
  location_id: null,
  customer: null,
  editingSaleId: null,
  editingServerId: null,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Check if item already exists
      const existingIndex = state.items.findIndex(item => 
        item.product_id === action.payload.product_id && 
        item.variation_id === action.payload.variation_id
      );
      
      if (existingIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...state.items];
        updatedItems[existingIndex].quantity += action.payload.quantity;
        updatedItems[existingIndex].total = 
          updatedItems[existingIndex].price * updatedItems[existingIndex].quantity;
        
        return { ...state, items: updatedItems };
      } else {
        // Add new item
        return { ...state, items: [...state.items, action.payload] };
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item => {
        if (item.id === action.payload.id) {
          const newQuantity = action.payload.quantity;
          return {
            ...item,
            quantity: newQuantity,
            total: item.price * newQuantity
          };
        }
        return item;
      });
      
      return { ...state, items: updatedItems };
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id)
      };
    
    case 'CLEAR_CART':
      return {
        ...initialState,
        location_id: state.location_id,
        customer: null,
        editingSaleId: null,
        editingServerId: null,
      };
    
    case 'SET_DISCOUNT':
      return { ...state, discount: action.payload };
    
    case 'SET_TAX':
      return { ...state, tax: action.payload };
    
    case 'SET_NOTE':
      return { ...state, note: action.payload };
    
    case 'SET_LOCATION':
      return { ...state, location_id: action.payload };
    
    case 'SET_CUSTOMER':
      return { ...state, customer: action.payload };

    case 'SET_EDITING_SALE':
      return { ...state, editingSaleId: action.payload };

    case 'SET_EDITING_SERVER_ID':
      return { ...state, editingServerId: action.payload };

    default:
      return state;
  }
};

interface CartContextType {
  cart: CartState;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  setDiscount: (amount: number) => void;
  setTax: (amount: number) => void;
  setNote: (note: string) => void;
  setLocation: (id: number) => void;
  setCustomer: (customer: any | null) => void;
  setEditingSale: (id: string | null) => void;
  setEditingServerId: (id: number | null) => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState);
  
  const addItem = (item: Omit<CartItem, 'id'>) => {
    const newItem = { ...item, id: Date.now() };
    dispatch({ type: 'ADD_ITEM', payload: newItem as CartItem });
  };
  
  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };
  
  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const setDiscount = (amount: number) => {
    dispatch({ type: 'SET_DISCOUNT', payload: amount });
  };
  
  const setTax = (amount: number) => {
    dispatch({ type: 'SET_TAX', payload: amount });
  };
  
  const setNote = (note: string) => {
    dispatch({ type: 'SET_NOTE', payload: note });
  };
  
  const setLocation = (id: number) => {
    dispatch({ type: 'SET_LOCATION', payload: id });
  };
  
  const setCustomer = (customer: any | null) => {
    dispatch({ type: 'SET_CUSTOMER', payload: customer });
  };

  const setEditingSale = (id: string | null) => {
    dispatch({ type: 'SET_EDITING_SALE', payload: id });
  };

  const setEditingServerId = (id: number | null) => {
    dispatch({ type: 'SET_EDITING_SERVER_ID', payload: id });
  };

  const getSubtotal = () => {
    return cart.items.reduce((sum, item) => sum + item.total, 0);
  };
  
  const getTotal = () => {
    const subtotal = getSubtotal();
    return subtotal - cart.discount + cart.tax;
  };
  
  // Load selected location on mount
  useEffect(() => {
    const loadSelectedLocation = async () => {
      try {
        const locationId = await getSelectedLocationId();
        if (locationId) {
          setLocation(locationId);
        }
      } catch (error) {
        console.error('Error loading selected location:', error);
      }
    };
    
    loadSelectedLocation();
  }, []);

  return (
    <CartContext.Provider value={{
      cart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      setDiscount,
      setTax,
      setNote,
      setLocation,
      setCustomer,
      setEditingSale,
      setEditingServerId,
      getSubtotal,
      getTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};
