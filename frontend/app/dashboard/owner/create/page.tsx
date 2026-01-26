"use client"

import { PromptBox } from "@/components/ui/PromptBox"
import { Button } from "@/components/ui/Button"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { ArrowLeft, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils" // Ensure utils exists or inline

function CreateWebsiteContent() {
   const router = useRouter()
   const searchParams = useSearchParams()
   const initialPrompt = searchParams.get("prompt") || ""

   const [isGenerating, setIsGenerating] = useState(false)
   const [generationStep, setGenerationStep] = useState(0)

   // Auto-start if prompt is present
   useEffect(() => {
      if (initialPrompt && !isGenerating) {
         handleGenerate(decodeURIComponent(initialPrompt))
      }
   }, [initialPrompt])

   const steps = [
      "Analyzing business requirements...",
      "Designing storefront UI/UX...",
      "Generating product inventory schema...",
      "Configuring payment gateways...",
      "Finalizing deployment..."
   ]

   const handleGenerate = async (prompt: string) => {
      setIsGenerating(true)
      setGenerationStep(0)

      // Start Animation
      const interval = setInterval(() => {
         setGenerationStep(prev => (prev < steps.length - 1 ? prev + 1 : prev))
      }, 1500)

      try {
         // Call our AWS Bedrock API (or fallback)
         const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
         });

         const result = await response.json();

         if (result.success) {
            clearInterval(interval)
            setGenerationStep(steps.length) // Complete

            // Encode the AI generated config to pass to the Editor (simplified state transfer)
            const configString = encodeURIComponent(JSON.stringify(result.data));

            setTimeout(() => {
               router.push(`/dashboard/owner/editor/new-site?config=${configString}`)
            }, 800)
         }
      } catch (error) {
         console.error("Generation failed", error)
         clearInterval(interval)
         setIsGenerating(false)
      }
   }


   return (
      <div className="min-h-screen bg-black text-white p-8 mb-20">
         <div className="max-w-4xl mx-auto space-y-8">
            <Button variant="ghost" className="text-gray-400" onClick={() => router.back()}>
               <ArrowLeft className="w-4 h-4 mr-2" />
               Back to Dashboard
            </Button>

            <div className="text-center space-y-4 mb-12">
               <h1 className="text-4xl font-bold">Create New Business</h1>
               <p className="text-gray-400">Describe your business, and our AI will build the entire operation in minutes.</p>
            </div>

            {!isGenerating ? (
               <div className="py-12">
                  <PromptBox onSubmit={handleGenerate} />
               </div>
            ) : (
               <div className="max-w-xl mx-auto bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl">
                  <div className="flex justify-center mb-8">
                     <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-50 animate-pulse" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                           <Sparkles className="w-8 h-8 text-white animate-spin-slow" />
                        </div>
                     </div>
                  </div>

                  <h3 className="text-xl font-medium text-center text-white mb-8">
                     Building your platform...
                  </h3>

                  <div className="space-y-6">
                     {steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-4">
                           <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-500",
                              index < generationStep
                                 ? "bg-green-500/20 border-green-500 text-green-500"
                                 : index === generationStep
                                    ? "border-indigo-500 text-indigo-500 animate-pulse"
                                    : "border-gray-800 text-gray-700"
                           )}>
                              {index < generationStep ? (
                                 <CheckCircle2 className="w-4 h-4" />
                              ) : index === generationStep ? (
                                 <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                 <div className="w-2 h-2 rounded-full bg-current" />
                              )}
                           </div>
                           <span className={cn(
                              "text-sm transition-colors duration-300",
                              index <= generationStep ? "text-gray-200" : "text-gray-600"
                           )}>
                              {step}
                           </span>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>
   )
}

export default function CreateWebsitePage() {
   return (
      <Suspense fallback={
         <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
         </div>
      }>
         <CreateWebsiteContent />
      </Suspense>
   )
}
