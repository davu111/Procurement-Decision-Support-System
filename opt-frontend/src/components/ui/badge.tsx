import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-600 border border-transparent",
        primary: "bg-primary-100 text-primary-700 border border-transparent",
        secondary: "bg-gray-100 text-gray-700 border border-gray-200",
        destructive: "bg-red-50 text-red-500 border border-transparent",
        outline: "text-gray-700 border border-gray-200",
        online: "bg-green-100 text-green-700 border border-green-200",
        offline: "bg-gray-100 text-gray-500 border border-gray-200",
        warning: "bg-amber-100 text-amber-700 border border-amber-200",
        success: "bg-green-50 text-green-600 border border-transparent",
        danger: "bg-red-50 text-red-500 border border-transparent",
        easy: "bg-green-100 text-green-700 border border-transparent",
        medium: "bg-amber-100 text-amber-700 border border-transparent",
        hard: "bg-red-100 text-red-600 border border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
