
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, ShoppingCart, Package, Users, BarChart2, Settings, Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Sales', href: '/sales', icon: BarChart2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className={cn(
      "border-r border-gray-200 bg-white transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <h1 className={cn(
          "font-bold text-xl text-sadiid-700 transition-opacity duration-200",
          isCollapsed ? "opacity-0 w-0" : "opacity-100"
        )}>
          Sadiid POS
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all",
              isActive
                ? "bg-sadiid-50 text-sadiid-700"
                : "text-gray-600 hover:bg-gray-100",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <item.icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
            <span className={cn(
              "transition-opacity duration-200",
              isCollapsed ? "hidden" : "block"
            )}>
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 text-center text-xs text-gray-500 border-t border-gray-200">
        {!isCollapsed && <span>© 2023 Sadiid POS</span>}
      </div>
    </div>
  );
};

export default Sidebar;
