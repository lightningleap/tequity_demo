import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const customButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transform active:scale-95 hover:shadow-md",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700",
        secondary: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 shadow-sm hover:from-gray-200 hover:to-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-100",
        success: "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:from-green-600 hover:to-emerald-600",
        warning: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg hover:from-yellow-600 hover:to-orange-600",
        danger: "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:from-red-600 hover:to-pink-600",
        outline: "border-2 border-current bg-transparent hover:bg-current hover:text-white transition-colors",
        ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
        neon: "bg-black text-cyan-400 border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]",
      },
      size: {
        xs: "h-6 px-2 py-1 text-xs rounded-md gap-1",
        sm: "h-8 px-3 py-2 text-xs rounded-md gap-1.5",
        default: "h-10 px-4 py-2 gap-2",
        lg: "h-12 px-6 py-3 text-base gap-2 rounded-xl",
        xl: "h-14 px-8 py-4 text-lg gap-3 rounded-xl",
        icon: "size-10 p-0",
      },
      shape: {
        default: "",
        rounded: "rounded-full",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      shape: "default",
    },
  }
)

function CustomButton({
  className,
  variant,
  size,
  shape,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="custom-button"
      className={cn(customButtonVariants({ variant, size, shape, className }))}
      {...props} />
  );
}

export { CustomButton, customButtonVariants }