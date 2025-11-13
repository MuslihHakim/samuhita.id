"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const EyeToggle = React.forwardRef(({
  className,
  show,
  onToggle,
  size = "sm",
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-6 w-6 text-xs",
        size === "default" && "h-8 w-8 text-sm",
        size === "lg" && "h-10 w-10 text-base",
        className
      )}
      {...props}
    >
      {show ? (
        // Eye closed icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10 10 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" x2="22" y1="2" y2="22" />
        </svg>
      ) : (
        // Eye open icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
      <span className="sr-only">
        {show ? "Hide" : "Show"}
      </span>
    </button>
  )
})

EyeToggle.displayName = "EyeToggle"

export { EyeToggle }