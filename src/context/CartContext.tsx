import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Constants
const CART_STORAGE_KEY = 'cart_data';
const LOCATION_STORAGE_KEY = 'selected_location_id';

export interface CartItem {
  id: number;
  product_id: number;
  variation_id: number | null;
  name: string;
  price: number;
  quantity: number;
  tax: number;
  discount: number;
}

interface CartState {
  items: CartItem[];
  discount: number;
  tax: number;
  note: string | null;
  location_id: number | null;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_DISCOUNT'; payload: number }
  | { type: 'SET_TAX'; payload: number }
  | { type: 'SET_NOTE'; payload: string | null }
  | { type: 'SET_LOCATION'; payload: number }
  | { type: 'RESTORE_CART'; payload: CartState };

const initialState: CartState = {
  items: [],
  discount: 0,
  tax: 0,
  note: null,
  location_id: null
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        (item) => item.product_id === action.payload.product_id && 
                  item.variation_id === action.payload.variation_id
      );

      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;
        return { ...state, items: updatedItems };
      } else {
        // New item, add to cart
        return { ...state, items: [...state.items, action.payload] };
      }
    }
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      const updatedItems = state.items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      return { ...state, items: updatedItems };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    }
    case 'CLEAR_CART':
      return { ...initialState, location_id: state.location_id };
    case 'SET_DISCOUNT':
      return { ...state, discount: action.payload };
    case 'SET_TAX':
      return { ...state, tax: action.payload };
    case 'SET_NOTE':
      return { ...state, note: action.payload };
    case 'SET_LOCATION':
      return { ...state, location_id: action.payload };
    case 'RESTORE_CART':
      return action.payload;
    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  setDiscount: (amount: number) => void;
  setTax: (amount: number) => void;
  setNote: (note: string | null) => void;
  setLocation: (locationId: number) => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // On mount, try to restore cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        dispatch({ type: 'RESTORE_CART', payload: JSON.parse(savedCart) });
      }

      // Try to get the selected location ID from localStorage
      const storedLocationId = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (storedLocationId) {
        const locationId = parseInt(storedLocationId, 10);
        if (!isNaN(locationId) && locationId > 0) {
          dispatch({ type: 'SET_LOCATION', payload: locationId });
        }
      }
    } catch (e) {
      console.error('Error restoring cart from localStorage:', e);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [state]);

  // Add item to cart
  const addItem = (item: Omit<CartItem, 'id'>) => {
    const cartItem = {
      ...item,
      id: Math.floor(Math.random() * 100000), // Simple ID generation
    };
    dispatch({ type: 'ADD_ITEM', payload: cartItem });
  };

  // Update item quantity
  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  // Remove item from cart
  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  // Clear cart
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Set discount
  const setDiscount = (amount: number) => {
    dispatch({ type: 'SET_DISCOUNT', payload: amount });
  };

  // Set tax
  const setTax = (amount: number) => {
    dispatch({ type: 'SET_TAX', payload: amount });
  };

  // Set note
  const setNote = (note: string | null) => {
    dispatch({ type: 'SET_NOTE', payload: note });
  };

  // Set location
  const setLocation = (locationId: number) => {
    dispatch({ type: 'SET_LOCATION', payload: locationId });
  };

  // Calculate subtotal
  const getSubtotal = () => {
    return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Calculate total
  const getTotal = () => {
    return getSubtotal() - state.discount + state.tax;
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        setDiscount,
        setTax,
        setNote,
        setLocation,
        getSubtotal,
        getTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};