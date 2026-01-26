import * as React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility for merging tailwind classes
export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs))
}

export interface ButtonProps
   extends React.ButtonHTMLAttributes<HTMLButtonElement> {
   variant?: "default" | "outline" | "ghost" | "link" | "premium"
   size?: "default" | "sm" | "lg" | "icon"
   isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
   ({ className, variant = "default", size = "default", isLoading, children, ...props }, ref) => {

      const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95"

      const variants = {
         default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
         premium: "bg-premium-gradient text-white hover:opacity-90 shadow-lg shadow-indigo-500/20 border-0",
         outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
         ghost: "hover:bg-accent hover:text-accent-foreground",
         link: "text-primary underline-offset-4 hover:underline",
      }

      const sizes = {
         default: "h-11 px-6 py-2",
         sm: "h-9 rounded-md px-3",
         lg: "h-14 rounded-xl px-10 text-base",
         icon: "h-10 w-10",
      }

      return (
         <button
            ref={ref}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={isLoading || props.disabled}
            {...props}
         >
            {isLoading ? (
               <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {children}
         </button>
      )
   }
)
Button.displayName = "Button"

export { Button }
