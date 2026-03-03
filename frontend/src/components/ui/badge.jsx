import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border \
   text-xs font-semibold transition-colors \
   overflow-hidden whitespace-nowrap truncate",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
      },
      size: {
        sm: "w-25 h-5",
        md: "w-30 h-8",
        lg: "w-40 h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
