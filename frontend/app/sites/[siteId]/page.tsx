"use client"

import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { ShoppingBag, Search, Plus, Minus, X, Star, Clock, MapPin, Phone, Lock, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

// Mock Data
const PRODUCTS = [
   { id: 1, name: "Signature Cold Brew", price: 250, image: "https://images.unsplash.com/photo-1517701604599-bb29b5dd73ad?w=500&q=80", category: "Coffee" },
   { id: 2, name: "Hazelnut Cappuccino", price: 220, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&q=80", category: "Coffee" },
   { id: 3, name: "Almond Croissant", price: 180, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80", category: "Pastry" },
   { id: 4, name: "Avocado Toast", price: 350, image: "https://images.unsplash.com/photo-1588137372308-15f75323a399?w=500&q=80", category: "Breakfast" },
]

export default function StoreFront() {
   const [cart, setCart] = useState<{ id: number, qty: number }[]>([])
   const [isCartOpen, setIsCartOpen] = useState(false)
   const [activeOrder, setActiveOrder] = useState<any>(null) // Mock active order
   const router = useRouter()

   // Derived state
   const cartItems = cart.map(item => {
      const product = PRODUCTS.find(p => p.id === item.id)
      return { ...product!, qty: item.qty }
   })

   const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0)

   const addToCart = (id: number) => {
      setCart(prev => {
         const existing = prev.find(i => i.id === id)
         if (existing) {
            return prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)
         }
         return [...prev, { id, qty: 1 }]
      })
      setIsCartOpen(true)
   }

   const removeFromCart = (id: number) => {
      setCart(prev => prev.filter(i => i.id !== id))
   }

   const handleCheckout = () => {
      // Simulate order creation
      setActiveOrder({
         id: "ORD-9921",
         status: "PREPARING", // PREPARING -> OUTFORDELIVERY -> DELIVERED
         otp: "1234",
         items: cartItems,
         total: totalAmount
      })
      setCart([])
      setIsCartOpen(false)

      // Simulate status update
      setTimeout(() => {
         setActiveOrder((prev: any) => ({ ...prev, status: "OUTFORDELIVERY" }))
      }, 3000)
   }

   return (
      <div className="min-h-screen bg-white text-gray-900 pb-20">
         {/* Store Header */}
         <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold">B</div>
                  <h1 className="font-bold text-xl tracking-tight">Bean & Brew</h1>
               </div>

               <div className="flex items-center gap-4">
                  {activeOrder && (
                     <button
                        onClick={() => setActiveOrder(activeOrder)} // Re-open tracking modal if closed (not implemented in this simplified view, relies on modal being conditional on activeOrder object existing in main view, or we can use a state for 'showTracking')
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50/50 text-green-600 rounded-full text-sm font-medium border border-green-100"
                     >
                        <Clock className="w-4 h-4 animate-pulse" />
                        Tracking Order
                     </button>
                  )}
                  <button
                     className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                     onClick={() => setIsCartOpen(!isCartOpen)}
                  >
                     <ShoppingBag className="w-6 h-6 text-gray-700" />
                     {cart.length > 0 && (
                        <span className="absolute top-0 right-0 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                           {cart.reduce((a, b) => a + b.qty, 0)}
                        </span>
                     )}
                  </button>
               </div>
            </div>
         </header>

         <main className="max-w-7xl mx-auto px-4 pt-8">
            {/* Hero Banner */}
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-12 bg-gray-900">
               <img
                  src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1200&q=80"
                  alt="Coffee Shop"
                  className="w-full h-full object-cover opacity-60"
               />
               <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
                  <span className="text-amber-400 font-medium tracking-wider uppercase text-sm mb-2">Est. 2024</span>
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">Artisan Coffee & Bakery</h2>
                  <p className="max-w-lg text-gray-200">Experience the finest blends from around the world, roasted locally in Bangalore.</p>
               </div>
            </div>

            {/* Categories */}
            <div className="flex overflow-x-auto gap-4 pb-8 scrollbar-hide">
               {["All", "Coffee", "Pastry", "Breakfast", "Merch"].map((cat, i) => (
                  <button
                     key={cat}
                     className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${i === 0 ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                     {cat}
                  </button>
               ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {PRODUCTS.map(product => (
                  <div key={product.id} className="group cursor-pointer">
                     <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 mb-3">
                        <img
                           src={product.image}
                           alt={product.name}
                           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <button
                           onClick={(e) => { e.stopPropagation(); addToCart(product.id) }}
                           className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                           <Plus className="w-5 h-5" />
                        </button>
                     </div>
                     <h3 className="font-semibold text-gray-900">{product.name}</h3>
                     <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-gray-900">₹{product.price}</span>
                        <div className="flex items-center text-xs text-amber-500">
                           <Star className="w-3 h-3 fill-current" />
                           <span className="ml-1 text-gray-500">4.8</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </main>

         {/* Cart Drawer Simulation */}
         {isCartOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
               <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
               <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in">
                  <div className="p-6 border-b flex items-center justify-between">
                     <h2 className="text-xl font-bold">Your Order</h2>
                     <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                     {cartItems.length === 0 ? (
                        <div className="text-center text-gray-500 mt-20">
                           <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                           <p>Your cart is empty</p>
                        </div>
                     ) : (
                        cartItems.map(item => (
                           <div key={item.id} className="flex gap-4">
                              <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                 <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                 <div className="flex justify-between items-start">
                                    <h3 className="font-medium">{item.name}</h3>
                                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                                       <X className="w-4 h-4" />
                                    </button>
                                 </div>
                                 <p className="text-sm text-gray-500 mt-1">₹{item.price}</p>
                                 <div className="flex items-center gap-3 mt-3">
                                    <button className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-50">-</button>
                                    <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                                    <button className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-50" onClick={() => addToCart(item.id)}>+</button>
                                 </div>
                              </div>
                           </div>
                        ))
                     )}
                  </div>

                  {cartItems.length > 0 && (
                     <div className="p-6 border-t bg-gray-50">
                        <div className="flex justify-between mb-4">
                           <span className="text-gray-600">Total</span>
                           <span className="font-bold text-xl">₹{totalAmount}</span>
                        </div>
                        <Button
                           className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg"
                           onClick={handleCheckout}
                        >
                           Checkout & Pay
                        </Button>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Tracking Modal */}
         {activeOrder && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveOrder(null)} />
               <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up sm:animate-fade-in">
                  <div className="h-2 bg-indigo-600 w-full" />
                  <div className="p-6">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h3 className="text-lg font-bold">Order #{activeOrder.id}</h3>
                           <p className="text-sm text-gray-500">{activeOrder.items.length} items • ₹{activeOrder.total}</p>
                        </div>
                        <button className="p-1 hover:bg-gray-100 rounded-full" onClick={() => setActiveOrder(null)}>
                           <X className="w-5 h-5 text-gray-400" />
                        </button>
                     </div>

                     <div className="space-y-6">
                        {/* Status Steps */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                 <CheckCircle className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className="font-medium text-sm">Order Confirmed</p>
                                 <p className="text-xs text-gray-500">Restaurant has accepted your order</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${activeOrder.status === 'OUTFORDELIVERY' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                 <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                              </div>
                              <div>
                                 <p className={`font-medium text-sm ${activeOrder.status === 'OUTFORDELIVERY' ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    {activeOrder.status === 'OUTFORDELIVERY' ? 'Out for Delivery' : 'Preparing...'}
                                 </p>
                                 <p className="text-xs text-gray-500">
                                    {activeOrder.status === 'OUTFORDELIVERY' ? 'Agent is on the way' : 'Estimated time: 15 mins'}
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* Delivery Agent Info */}
                        {activeOrder.status === 'OUTFORDELIVERY' && (
                           <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gray-200" />
                              <div className="flex-1">
                                 <p className="font-medium text-sm">Ramesh Kumar</p>
                                 <p className="text-xs text-gray-500">Delivery Partner</p>
                              </div>
                              <button className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                                 <Phone className="w-4 h-4" />
                              </button>
                           </div>
                        )}

                        {/* Secure OTP */}
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                           <p className="text-xs text-indigo-600 font-medium mb-1 flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3" /> Secure Delivery Code
                           </p>
                           <p className="text-3xl font-bold text-gray-900 tracking-widest">{activeOrder.otp}</p>
                           <p className="text-[10px] text-gray-500 mt-1">Share this code with agent only upon arrival</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   )
}
