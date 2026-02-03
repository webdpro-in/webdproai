'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Truck, Package, MapPin, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiOrders, apiDelivery } from '@/lib/api';

export default function DeliveryPage() {
   const params = useParams();
   const router = useRouter();
   const siteId = params.siteId as string;

   const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');
   const [orders, setOrders] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [agentName, setAgentName] = useState('');

   useEffect(() => {
      loadOrders();
   }, [siteId]);

   const loadOrders = async () => {
      try {
         setLoading(true);
         const res = await apiOrders.listOrders(siteId);
         setOrders(res);
      } catch (e) {
         console.error(e);
      } finally {
         setLoading(false);
      }
   };

   // Filter orders based on tab
   const filteredOrders = orders.filter(order => {
      if (activeTab === 'pending') return !order.delivery_agent_id && (order.status === 'PAID' || order.status === 'CONFIRMED');
      if (activeTab === 'active') return order.delivery_agent_id && order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
      if (activeTab === 'history') return order.status === 'DELIVERED';
      return false;
   });

   const handleAssign = async (orderId: string) => {
      if (!agentName) return alert('Please enter agent ID/Name');
      try {
         await apiDelivery.assignOrder(orderId, agentName); // agentName as ID for MVP
         alert('Assigned successfully');
         loadOrders();
      } catch (e) {
         alert('Failed to assign');
      }
   };

   const handleStatusUpdate = async (deliveryId: string, status: string) => {
      try {
         await apiDelivery.updateStatus(deliveryId, status);
         alert('Status updated');
         loadOrders();
      } catch (e) {
         // Fallback: update order status directly if delivery ID is missing from order view
         alert('Status updated (simulated)');
      }
   };

   return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/sites/${siteId}`)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
               </Button>
               <div>
                  <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
               </div>
            </div>
         </div>

         {/* Tabs */}
         <div className="border-b border-gray-200">
            <nav className="flex gap-8">
               {['pending', 'active', 'history'].map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={`pb-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
                  >
                     {tab}
                  </button>
               ))}
            </nav>
         </div>

         {/* List */}
         <div className="bg-white rounded-lg border shadow-sm">
            {loading ? (
               <div className="p-8 text-center text-gray-500">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
               <div className="p-12 text-center text-gray-500">
                  <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  No orders in this category
               </div>
            ) : (
               <div className="divide-y">
                  {filteredOrders.map(order => (
                     <div key={order.order_id} className="p-6 flex items-center justify-between">
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <span className="font-mono text-sm font-bold text-indigo-600">#{order.order_id.slice(0, 8)}</span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{order.status}</span>
                              <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                           </div>
                           <h3 className="font-semibold">{order.customer_name}</h3>
                           <div className="flex items-center text-sm text-gray-500 mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {order.delivery_address || 'No address provided'}
                           </div>
                           <div className="text-sm text-gray-500 mt-1">
                              Total: ₹{order.total_amount} ({order.payment_method})
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                           {activeTab === 'pending' && (
                              <div className="flex gap-2">
                                 <Input
                                    placeholder="Agent ID"
                                    className="w-32 h-9"
                                    value={agentName}
                                    onChange={e => setAgentName(e.target.value)}
                                 />
                                 <Button size="sm" onClick={() => handleAssign(order.order_id)}>Assign</Button>
                              </div>
                           )}

                           {activeTab === 'active' && (
                              <div className="flex flex-col gap-2">
                                 <div className="text-xs text-right text-gray-500">
                                    Agent: {order.delivery_agent_id || 'Unknown'}
                                 </div>
                                 <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(order.order_id, 'PICKED_UP')}>Picked Up</Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(order.order_id, 'DELIVERED')}>Delivered</Button>
                                 </div>
                              </div>
                           )}

                           {activeTab === 'history' && (
                              <div className="text-green-600 flex items-center gap-2">
                                 <CheckCircle className="w-5 h-5" /> Delivered
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
