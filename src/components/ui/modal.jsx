import * as React from "react"
import { createPortal } from "react-dom"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./button"

const modalVariants = cva(
  "relative z-50 max-h-[85vh] w-full max-w-lg overflow-hidden rounded-lg border bg-background shadow-lg transition-all",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const backdropVariants = cva(
  "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity",
  {
    variants: {
      variant: {
        default: "bg-black/50",
        light: "bg-black/30",
        dark: "bg-black/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Modal({
  children,
  isOpen = false,
  onClose,
  size,
  backdropVariant,
  showCloseButton = true,
  className,
  backdropClassName,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  ...props
}) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  React.useEffect(() => {
    if (!closeOnEscape) return

    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen && onClose) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, closeOnEscape])

  const handleBackdropClick = (event) => {
    if (closeOnBackdropClick && event.target === event.currentTarget && onClose) {
      onClose()
    }
  }

  if (!mounted || !isOpen) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className={cn(backdropVariants({ variant: backdropVariant }), backdropClassName)}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(modalVariants({ size }), className)}
        {...props}
      >
        {showCloseButton && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}

const ModalHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6 pb-4 border-b",
      className
    )}
    {...props}
  />
))
ModalHeader.displayName = "ModalHeader"

const ModalTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
ModalTitle.displayName = "ModalTitle"

const ModalDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
ModalDescription.displayName = "ModalDescription"

const ModalBody = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-4", className)}
    {...props}
  />
))
ModalBody.displayName = "ModalBody"

const ModalFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4 border-t",
      className
    )}
    {...props}
  />
))
ModalFooter.displayName = "ModalFooter"

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  modalVariants,
  backdropVariants,
}