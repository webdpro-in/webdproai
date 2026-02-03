'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Package, ShoppingCart, Bell, Search, Plus, Edit, Trash2, AlertTriangle, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AIChatbot } from '@/components/ai/AIChatbot';
import { apiInventory, apiStores } from '@/lib/api';

interface Product {
   product_id: string;
   name: string;
   description: string;
   price: number;
   stock_quantity: number;
   category: string;
   sku?: string;
}

export default function InventoryPage() {
   const params = useParams();
   const router = useRouter();
   const siteId = params.siteId as string;

   const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'notifications'>('products');
   const [loading, setLoading] = useState(true);
   const [storeName, setStoreName] = useState('My Store');
   const [products, setProducts] = useState<Product[]>([]);

   // Modal State
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
   const [formData, setFormData] = useState<Partial<Product>>({});

   useEffect(() => {
      if (siteId) loadData();
   }, [siteId]);

   const loadData = async () => {
      try {
         const [storeRes, productsRes] = await Promise.all([
            apiStores.getStore(siteId),
            apiInventory.getProducts(siteId)
         ]);
         setStoreName(storeRes.store.prompt || 'My Store');
         setProducts(productsRes as Product[]);
      } catch (error) {
         console.error('Failed to load inventory:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleCreate = () => {
      setEditingProduct(null);
      setFormData({ stock_quantity: 10, price: 0 });
      setIsModalOpen(true);
   };

   const handleEdit = (product: Product) => {
      setEditingProduct(product);
      setFormData(product);
      setIsModalOpen(true);
   };

   const handleDelete = async (productId: string) => {
      if (!confirm('Are you sure you want to delete this product?')) return;
      try {
         await apiInventory.deleteProduct(siteId, productId);
         setProducts(prev => prev.filter(p => p.product_id !== productId));
      } catch (e) {
         alert('Failed to delete product');
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         if (editingProduct) {
            await apiInventory.updateProduct(siteId, editingProduct.product_id, formData);
            setProducts(prev => prev.map(p => p.product_id === editingProduct.product_id ? { ...p, ...formData } : p));
         } else {
            await apiInventory.createProduct(siteId, { ...formData, store_id: siteId });
            // Reload to get ID
            const res = await apiInventory.getProducts(siteId);
            setProducts(res as Product[]);
         }
         setIsModalOpen(false);
      } catch (e) {
         console.error(e);
         alert('Failed to save product');
      }
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader />
         </div>
      );
   }

   return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
         {/* Header */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/sites/${siteId}`)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
               </Button>
               <div>
                  <h1 className="text-2xl font-bold text-gray-900">{storeName} - Inventory</h1>
               </div>
            </div>
         </div>

         {/* Tabs */}
         <div className="border-b border-gray-200">
            <nav className="flex gap-8">
               <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package className="w-4 h-4 mr-2" />} label="Products" />
               <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ShoppingCart className="w-4 h-4 mr-2" />} label="Orders" />
               <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<Bell className="w-4 h-4 mr-2" />} label="Notifications" />
            </nav>
         </div>

         {/* Active Content */}
         <div className="bg-white rounded-lg border border-gray-200 min-h-[400px]">
            {activeTab === 'products' && (
               <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                     <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="Search products..." className="pl-10" />
                     </div>
                     <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add Product
                     </Button>
                  </div>

                  {products.length === 0 ? (
                     <EmptyState icon={<Package className="w-12 h-12" />} title="No products yet" subtitle="Add your first product to start selling" />
                  ) : (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                           <thead className="bg-gray-50 text-gray-500 font-medium">
                              <tr>
                                 <th className="p-3">Name</th>
                                 <th className="p-3">Category</th>
                                 <th className="p-3">Price</th>
                                 <th className="p-3">Stock</th>
                                 <th className="p-3 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y">
                              {products.map(product => (
                                 <tr key={product.product_id} className="hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-900">{product.name}</td>
                                    <td className="p-3 text-gray-500">{product.category}</td>
                                    <td className="p-3">₹{product.price}</td>
                                    <td className="p-3">
                                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${product.stock_quantity < 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                          {product.stock_quantity < 5 && <AlertTriangle className="w-3 h-3 mr-1" />}
                                          {product.stock_quantity}
                                       </span>
                                    </td>
                                    <td className="p-3 text-right space-x-2">
                                       <button onClick={() => handleEdit(product)} className="p-1 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
                                       <button onClick={() => handleDelete(product.product_id)} className="p-1 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'orders' && <EmptyState icon={<ShoppingCart className="w-12 h-12" />} title="No orders yet" subtitle="Orders will appear here" />}
            {activeTab === 'notifications' && <EmptyState icon={<Bell className="w-12 h-12" />} title="No notifications" subtitle="Updates will appear here" />}
         </div>

         {/* Product Modal */}
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                     <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <Input required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea required rows={3} className="w-full border rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                           <Input type="number" min="0" required value={formData.price || ''} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                           <Input type="number" min="0" required value={formData.stock_quantity || ''} onChange={e => setFormData({ ...formData, stock_quantity: Number(e.target.value) })} />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <Input required value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                     </div>

                     <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Product</Button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         <AIChatbot storeId={siteId} businessContext={{ name: storeName, type: 'general' }} />
      </div>
   );
}

function Loader() {
   return (
      <div className="text-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
         <p className="text-gray-600">Loading inventory...</p>
      </div>
   );
}

function TabButton({ active, onClick, icon, label }: any) {
   return (
      <button
         onClick={onClick}
         className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
      >
         {icon} {label}
      </button>
   );
}

function EmptyState({ icon, title, subtitle }: any) {
   return (
      <div className="text-center py-20 text-gray-500">
         <div className="mx-auto mb-4 bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center text-gray-400">
            {icon}
         </div>
         <p className="font-medium text-lg text-gray-900">{title}</p>
         <p className="text-sm">{subtitle}</p>
      </div>
   );
}
