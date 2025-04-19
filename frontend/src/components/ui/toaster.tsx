import * as React from "react"
import { ToastProvider, ToastViewport } from "./toast"

const Toaster = () => {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}

export { Toaster } 