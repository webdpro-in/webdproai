import LoginView from "@/components/auth/LoginView";

export default function LoginPage() {
   return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
         </div>

         <div className="relative z-10 w-full flex flex-col items-center">
            <div className="mb-8 text-center">
               <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
                  WebDPro <span className="text-indigo-600">AI</span>
               </h1>
               <p className="text-gray-500 text-lg">
                  Launch your business website in <span className="font-semibold text-gray-900">minutes</span>
               </p>
            </div>
            <LoginView />
            <p className="mt-8 text-center text-xs text-gray-400">
               By logging in, you agree to our Terms & Conditions.
            </p>
         </div>
      </div>
   );
}
