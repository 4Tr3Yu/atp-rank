"use client"

import { createContext, useContext, useOptimistic, useCallback, type ReactNode } from "react"

interface LoadingContextValue {
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setLoading] = useOptimistic(false)

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}

export function useFormAction<T extends unknown[]>(
  action: (...args: T) => Promise<void>
) {
  const { setLoading } = useLoading()

  const wrappedAction = useCallback(
    async (...args: T) => {
      setLoading(true)
      await action(...args)
    },
    [action, setLoading]
  )

  return wrappedAction
}
