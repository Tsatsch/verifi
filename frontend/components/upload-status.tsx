"use client"

import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import type { StepState } from "@/types/upload/step"
import { cn } from "@/lib/utils"

interface UploadStatusProps {
  stepStates: StepState[]
  isUploading: boolean
  error?: string
  fileName?: string
}

export function UploadStatus({ stepStates, isUploading, error, fileName }: UploadStatusProps) {
  if (!isUploading && !error) {
    return null
  }

  const hasError = !!error
  const isCompleted = stepStates.every((s) => s.status === 'completed')
  const currentStep = stepStates.find((s) => s.status === 'in-progress') || stepStates.find((s) => s.status === 'error')

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-zinc-700 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {hasError ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-cyber-cyan" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white">
            {hasError ? "Upload Failed" : isCompleted ? "Upload Complete" : "Uploading..."}
          </div>
          {fileName && (
            <div className="mt-1 truncate text-sm text-zinc-400">{fileName}</div>
          )}
          {currentStep && (
            <div className="mt-2 text-xs text-zinc-500">
              {currentStep.step.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </div>
          )}
          {error && (
            <div className="mt-2 text-xs text-red-400">{error}</div>
          )}
          {!hasError && !isCompleted && (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-cyber-cyan transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      stepStates.reduce((acc, s) => acc + s.progress, 0) / stepStates.length
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
