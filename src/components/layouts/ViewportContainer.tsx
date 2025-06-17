import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ViewportContainerProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

const ViewportContainer = ({ 
  children, 
  className, 
  padding = true 
}: ViewportContainerProps) => {
  return (
    <div className={cn(
      "h-full w-full overflow-hidden flex flex-col",
      padding && "p-4",
      className
    )}>
      {children}
    </div>
  );
};

export default ViewportContainer;
