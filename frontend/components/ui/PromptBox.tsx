"use client"

import * as React from "react"
import { Sparkles, ArrowRight, Command } from "lucide-react"
import { cn as cnUtil } from "@/lib/utils" // Ensure utils is available or use alias

// Fallback if @/lib/utils/cn doesn't exist yet, we'll assume it handles class merging.
// Since I created cn in Button.tsx, I should probably move it to a shared util or import from there.
// For now, I will inline a simple version or import from Button if possible, 
// but usually `lib/utils` is the standard place. 
// I will assuming I should create `lib/utils.ts` as well for future proofing.

// Using relative import for now as I recall creating it in components/ui/Button.tsx
// but to be "future proof" I should move `cn` to `lib/utils.ts`. 
// I will do that in a separate step or just redefine it here to be safe for this specific component to avoid breakage.



interface PromptBoxProps {
   onSubmit: (prompt: string) => void
   isGenerating?: boolean
}

export function PromptBox({ onSubmit, isGenerating }: PromptBoxProps) {
   const [prompt, setPrompt] = React.useState("")
   const [isFocused, setIsFocused] = React.useState(false)

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (prompt.trim()) {
         onSubmit(prompt)
      }
   }

   return (
      <div className="w-full max-w-3xl mx-auto relative group z-20">
         {/* Background Glow Effect */}
         <div
            className={cnUtil(
               "absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-xl transition-all duration-500",
               isFocused ? "opacity-50 blur-2xl" : "group-hover:opacity-30"
            )}
         />

         <form onSubmit={handleSubmit} className="relative">
            <div
               className={cnUtil(
                  "relative flex items-center bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-2 transition-all duration-300 overflow-hidden shadow-sm",
                  isFocused ? "ring-2 ring-indigo-500/20 scale-[1.02] border-indigo-200" : "hover:border-gray-300"
               )}
            >
               {/* Icon */}
               <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 ml-2">
                  <Sparkles className={cnUtil("w-6 h-6", isGenerating ? "animate-spin" : "animate-pulse")} />
               </div>

               {/* Input */}
               <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Describe your dream business... (e.g. 'Minimalist coffee shop in Tokyo')"
                  className="flex-1 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:ring-0 px-4 py-3 text-lg outline-none"
                  disabled={isGenerating}
               />

               {/* Action Button */}
               <button
                  type="submit"
                  disabled={!prompt.trim() || isGenerating}
                  className={cnUtil(
                     "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
                     prompt.trim() && !isGenerating
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
               >
                  {isGenerating ? (
                     <span className="flex items-center gap-2">
                        Processing...
                     </span>
                  ) : (
                     <>
                        <span>Generate</span>
                        <ArrowRight className="w-4 h-4" />
                     </>
                  )}
               </button>
            </div>
         </form>

         {/* Suggestions / Helper Text */}
         <div className={cnUtil("absolute top-full left-0 w-full mt-4 transition-all duration-500", isFocused ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none")}>
            <div className="flex flex-wrap gap-2 justify-center">
               {["Online Fashion Store", "Organic Grocery Delivery", "Dental Clinic Management", "Freelance Portfolio"].map((suggestion) => (
                  <button
                     key={suggestion}
                     type="button"
                     onClick={() => setPrompt(suggestion)}
                     className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                  >
                     {suggestion}
                  </button>
               ))}
            </div>
         </div>
      </div>
   )
}
