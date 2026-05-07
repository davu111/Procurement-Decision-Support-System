import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-primary-500/40 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.45)]",
        primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.45)]",
        secondary: "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 active:bg-gray-300",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-[0_4px_12px_rgba(239,68,68,0.3)]",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-[0_4px_12px_rgba(239,68,68,0.3)]",
        outline: "bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 hover:border-primary-400",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 text-sm rounded-xl",
        sm: "h-7 px-3 text-xs rounded-lg",
        md: "h-9 px-4 text-sm rounded-xl",
        lg: "h-11 px-6 text-sm rounded-xl font-semibold",
        xl: "h-12 px-8 text-base rounded-2xl font-semibold",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
