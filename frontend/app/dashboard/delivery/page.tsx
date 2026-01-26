"use client"

import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { MapPin, Phone, Package, CheckCircle, Navigation, Clock, Lock } from "lucide-react"
import { useState } from "react"

// Mock Orders
const ORDERS = [
   {
      id: "ORD-7782",
      customer: "Rahul S.",
      address: "Flat 402, Green Heights, Indiranagar",
      amount: 450,
      payment: "COD",
      status: "ASSIGNED",
      itemCount: 3,
      time: "10 mins ago",
      otp: "1234"
   },
   {
      id: "ORD-7785",
      customer: "Priya M.",
      address: "12, 4th Cross, Koramangala",
      amount: 1200,
      payment: "PAID",
      status: "PICKED_UP",
      itemCount: 5,
      time: "25 mins ago",
      otp: "1234"
   }
]

export default function DeliveryDashboard() {
   const [orders, setOrders] = useState(ORDERS)
   const [verifyingId, setVerifyingId] = useState<string | null>(null)
   const [otpInput, setOtpInput] = useState("")
   const [error, setError] = useState(false)

   const updateStatus = (id: string, newStatus: string) => {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
   }

   const handleVerifyOtp = (id: string, correctOtp: string) => {
      if (otpInput === correctOtp) {
         updateStatus(id, "DELIVERED")
         setVerifyingId(null)
         setOtpInput("")
         setError(false)
      } else {
         setError(true)
      }
   }

   return (
      <div className="min-h-screen bg-black text-white p-4 pb-24">
         <header className="flex justify-between items-center mb-8 pt-4">
            <div>
               <h1 className="text-2xl font-bold text-white">Deliveries</h1>
               <p className="text-gray-400 text-sm">You have {orders.filter(o => o.status !== 'DELIVERED').length} active orders</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               Online
            </div>
         </header>

         <div className="space-y-4">
            {orders.map(order => (
               <Card key={order.id} className="border-gray-800 bg-gray-900/50">
                  <CardContent className="p-5">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <h3 className="font-bold text-lg text-white">{order.customer}</h3>
                           <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" /> {order.time}
                           </span>
                        </div>
                        <div className="text-right">
                           <span className="block font-bold text-white">₹{order.amount}</span>
                           <span className={`text-xs px-2 py-0.5 rounded-full ${order.payment === "COD" ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"}`}>
                              {order.payment}
                           </span>
                        </div>
                     </div>

                     <div className="space-y-3 mb-6">
                        <div className="flex gap-3">
                           <div className="mt-1 w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-indigo-400" />
                           </div>
                           <p className="text-sm text-gray-300 leading-tight pt-1.5">{order.address}</p>
                        </div>
                        <div className="flex gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-gray-400" />
                           </div>
                           <p className="text-sm text-gray-400 pt-1.5">{order.itemCount} items in order</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        {order.status === "ASSIGNED" && (
                           <>
                              <Button
                                 variant="outline"
                                 className="border-gray-700 hover:bg-gray-800 text-white"
                                 onClick={() => window.open("tel:9999999999")}
                              >
                                 <Phone className="w-4 h-4 mr-2" />
                                 Call
                              </Button>
                              <Button
                                 className="bg-indigo-600 hover:bg-indigo-500 text-white border-none"
                                 onClick={() => updateStatus(order.id, "PICKED_UP")}
                              >
                                 Accept Order
                              </Button>
                           </>
                        )}

                        {order.status === "PICKED_UP" && (
                           <div className="col-span-2 space-y-3">
                              {verifyingId === order.id ? (
                                 <div className="animate-fade-in space-y-3 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                                       <Lock className="w-4 h-4 text-indigo-400" />
                                       Ask Customer for Delivery OTP
                                    </div>
                                    <Input
                                       value={otpInput}
                                       onChange={e => setOtpInput(e.target.value)}
                                       placeholder="Enter 4-digit OTP (1234)"
                                       className="bg-black/50 border-gray-600 font-mono text-center tracking-widest text-lg"
                                       maxLength={4}
                                    />
                                    {error && <p className="text-xs text-red-400 text-center">Incorrect OTP. Try again.</p>}
                                    <div className="flex gap-2">
                                       <Button variant="outline" className="flex-1" onClick={() => setVerifyingId(null)}>Cancel</Button>
                                       <Button className="flex-1 bg-green-600 hover:bg-green-500" onClick={() => handleVerifyOtp(order.id, order.otp)}>Confirm</Button>
                                    </div>
                                 </div>
                              ) : (
                                 <>
                                    <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white">
                                       <Navigation className="w-4 h-4 mr-2" />
                                       Navigate
                                    </Button>
                                    <Button
                                       className="w-full bg-green-600 hover:bg-green-500 text-white"
                                       onClick={() => {
                                          setVerifyingId(order.id)
                                          setOtpInput("")
                                          setError(false)
                                       }}
                                    >
                                       <CheckCircle className="w-4 h-4 mr-2" />
                                       Verify & Complete
                                    </Button>
                                 </>
                              )}
                           </div>
                        )}

                        {order.status === "DELIVERED" && (
                           <div className="col-span-2 text-center py-4 text-green-500 bg-green-500/10 rounded-xl border border-green-500/20 animate-fade-in">
                              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                              <p className="font-medium">Delivered Successfully</p>
                           </div>
                        )}
                     </div>
                  </CardContent>
               </Card>
            ))}
         </div>
      </div>
   )
}
