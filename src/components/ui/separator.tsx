import * as React from "react"
import { cn } from "@/lib/utils"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    const orientationClasses = {
      horizontal: "h-px w-full",
      vertical: "h-full w-px"
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "bg-gray-200",
          orientationClasses[orientation],
          className
        )}
        {...props}
      />
    )
  }
)
Separator.displayName = "Separator"

export { Separator }
