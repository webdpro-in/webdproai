"use client";

import { Plus, Search, AlertCircle, Edit2, Trash2 } from "lucide-react";

const MOCK_INVENTORY = [
   { id: "prod_1", name: "Classic White Tee", sku: "TSHIRT-001", stock: 154, price: 599, status: "IN_STOCK" },
   { id: "prod_2", name: "Denim Jacket", sku: "JKT-DNM-02", stock: 12, price: 2499, status: "LOW_STOCK" },
   { id: "prod_3", name: "Summer Dress", sku: "DRS-SMR-03", stock: 0, price: 1299, status: "OUT_OF_STOCK" },
];

export default function InventoryPage() {
   return (
      <div className="max-w-6xl mx-auto space-y-8">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
               <p className="text-gray-500 mt-1">Manage your products and stock levels.</p>
            </div>
            <button className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm">
               <Plus className="h-5 w-5 mr-2" />
               Add Product
            </button>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
               <div className="relative max-w-sm w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                     type="text"
                     className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                     placeholder="Search products..."
                  />
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                     <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                     {MOCK_INVENTORY.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                 <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md"></div>
                                 <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.sku}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.stock}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{product.price}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                 ${product.status === 'IN_STOCK' ? 'bg-green-100 text-green-800' :
                                    product.status === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-800' :
                                       'bg-red-100 text-red-800'}`}>
                                 {product.status.replace('_', ' ')}
                              </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-gray-400 hover:text-indigo-600 mr-3">
                                 <Edit2 className="h-4 w-4" />
                              </button>
                              <button className="text-gray-400 hover:text-red-600">
                                 <Trash2 className="h-4 w-4" />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
}
