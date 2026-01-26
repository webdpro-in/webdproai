"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ExternalLink, Globe, Clock, MoreVertical } from "lucide-react";

// Mock data for MVP
const MOCK_SITES = [
   {
      id: "site_1",
      name: "Fashion Boutique",
      url: "https://d3v...cloudfront.net",
      status: "PUBLISHED",
      createdAt: "2024-01-20T10:00:00Z",
      thumbnail: "https://placehold.co/600x400/indigo/white?text=Fashion+Store"
   }
];

export default function SitesPage() {
   return (
      <div className="max-w-6xl mx-auto space-y-8">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold text-gray-900">My Websites</h1>
               <p className="text-gray-500 mt-1">Manage and customize your AI-generated stores.</p>
            </div>
            <Link
               href="/dashboard/sites/new"
               className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
               <Plus className="h-5 w-5 mr-2" />
               Create New Website
            </Link>
         </div>

         {MOCK_SITES.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
               <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-gray-900">No websites yet</h3>
               <p className="text-gray-500 mt-1 mb-6">Create your first AI-powered store in seconds.</p>
               <Link
                  href="/dashboard/sites/new"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
               >
                  Create Website
               </Link>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {MOCK_SITES.map((site) => (
                  <div key={site.id} className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                     {/* Thumbnail / Preview */}
                     <div className="relative h-48 bg-gray-100 border-b border-gray-50 group-hover:opacity-90 transition-opacity">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                           src={site.thumbnail}
                           alt={site.name}
                           className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 shadow-sm">
                              Live
                           </span>
                        </div>
                     </div>

                     {/* Content */}
                     <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                           <div>
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                 {site.name}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1 flex items-center">
                                 <Clock className="h-3 w-3 mr-1" />
                                 Last updated 2 days ago
                              </p>
                           </div>
                           <button className="text-gray-400 hover:text-gray-600">
                              <MoreVertical className="h-5 w-5" />
                           </button>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                           <a
                              href={site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
                           >
                              Visit Store <ExternalLink className="h-3 w-3 ml-1" />
                           </a>
                           <button className="text-sm font-medium text-gray-600 hover:text-gray-900">
                              Edit
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
