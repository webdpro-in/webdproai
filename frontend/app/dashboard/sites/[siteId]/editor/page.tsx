'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiStores } from '@/lib/api';
import { Loader2, ArrowLeft, Save, RotateCcw, Monitor, Smartphone, Palette, Layout, Type, Image as ImageIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Types for Store Config
interface Section {
   id: string;
   type: string;
   title?: string;
   subtitle?: string;
   content?: any;
   imagePrompt?: string;
}

interface StoreConfig {
   meta: {
      title: string;
      description: string;
      theme_color: string;
   };
   sections: Section[];
}

export default function EditorPage() {
   const params = useParams();
   const router = useRouter();
   const siteId = params?.siteId as string;

   const [store, setStore] = useState<any>(null);
   const [config, setConfig] = useState<StoreConfig | null>(null);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [iframeKey, setIframeKey] = useState(0);
   const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

   // Selection State
   const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
   const [activeTab, setActiveTab] = useState<'layout' | 'design'>('layout');

   useEffect(() => {
      if (siteId) {
         loadStore();
      }
   }, [siteId]);

   const loadStore = async () => {
      try {
         const res = await apiStores.getStore(siteId);
         setStore(res.store);
         if (res.store.config) {
            setConfig(res.store.config);
         }
      } catch (error) {
         console.error('Failed to load store:', error);
      } finally {
         setLoading(false);
      }
   };

   // Update local config
   const updateSection = (sectionId: string, updates: Partial<Section>) => {
      if (!config) return;

      const newSections = config.sections.map(s =>
         s.id === sectionId ? { ...s, ...updates } : s
      );

      setConfig({ ...config, sections: newSections });
   };

   const updateMeta = (updates: Partial<StoreConfig['meta']>) => {
      if (!config) return;
      setConfig({ ...config, meta: { ...config.meta, ...updates } });
   };

   // Save and Regenerate
   const handleSave = async () => {
      if (!config) return;
      setSaving(true);
      try {
         // 1. Update Config & Regenerate HTML (Backend Builder)
         const res = await apiStores.regenerateStore(siteId, config);

         if (res.success) {
            // 2. Reload Iframe
            setIframeKey(k => k + 1);

            // 3. Update local store object if needed
            setStore((prev: any) => ({ ...prev, preview_url: res.preview_url }));
         }
      } catch (error) {
         console.error('Save failed:', error);
         alert('Failed to save changes');
      } finally {
         setSaving(false);
      }
   };

   const publishChanges = async () => {
      if (!confirm('Are you sure you want to publish these changes to the live domain?')) return;
      try {
         await apiStores.publishStore(siteId);
         alert('Published successfully!');
      } catch (e) {
         alert('Publish failed');
      }
   };

   if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
   if (!store) return <div className="p-8">Store not found</div>;

   const selectedSection = config?.sections.find(s => s.id === selectedSectionId);

   return (
      <div className="flex bg-gray-100 h-screen overflow-hidden">
         {/* Sidebar Editor */}
         <div className="w-80 bg-white border-r flex flex-col z-20 shadow-xl">
            <div className="p-4 border-b flex items-center justify-between bg-indigo-50">
               <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-indigo-600" /> Editor
               </h2>
               <div className="flex gap-1">
                  <button
                     onClick={() => setActiveTab('layout')}
                     className={`p-2 rounded-md ${activeTab === 'layout' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                     <Layout className="w-4 h-4" />
                  </button>
                  <button
                     onClick={() => setActiveTab('design')}
                     className={`p-2 rounded-md ${activeTab === 'design' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                     <Palette className="w-4 h-4" />
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
               {activeTab === 'layout' && config ? (
                  <div className="space-y-2">
                     <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sections</h3>
                     {config.sections.map((section) => (
                        <div key={section.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                           <button
                              onClick={() => setSelectedSectionId(selectedSectionId === section.id ? null : section.id)}
                              className={`w-full flex items-center justify-between p-3 text-sm font-medium transition-colors ${selectedSectionId === section.id ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-700'}`}
                           >
                              <span className="capitalize">{section.type.replace('_', ' ')}</span>
                              {selectedSectionId === section.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                           </button>

                           {selectedSectionId === section.id && (
                              <div className="p-3 bg-gray-50 border-t space-y-3">
                                 <div>
                                    <label className="text-xs text-gray-500 block mb-1">Title</label>
                                    <input
                                       type="text"
                                       value={section.title || ''}
                                       onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                       className="w-full text-sm border rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-xs text-gray-500 block mb-1">Subtitle / Content</label>
                                    <textarea
                                       rows={3}
                                       value={section.subtitle || ''}
                                       onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                                       className="w-full text-sm border rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                                    />
                                 </div>
                                 {section.imagePrompt && (
                                    <div>
                                       <label className="text-xs text-gray-500 block mb-1">Image Prompt</label>
                                       <div className="flex gap-2">
                                          <input
                                             type="text"
                                             value={section.imagePrompt}
                                             readOnly
                                             className="flex-1 text-xs border rounded px-2 py-1 bg-gray-100 text-gray-500"
                                          />
                                          <Button size="sm" variant="outline" className="h-6 px-2" title="Regenerate Image"><ImageIcon className="w-3 h-3" /></Button>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="space-y-4">
                     {config && (
                        <div>
                           <label className="text-sm font-medium text-gray-700 block mb-2">Theme Color</label>
                           <div className="flex gap-2 flex-wrap">
                              {['#4F46E5', '#0891B2', '#EA580C', '#16A34A', '#DC2626', '#000000'].map(c => (
                                 <button
                                    key={c}
                                    onClick={() => updateMeta({ theme_color: c })}
                                    className={`w-8 h-8 rounded-full border-2 ${config.meta.theme_color === c ? 'border-indigo-600 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                 />
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               )}
            </div>

            <div className="p-4 border-t bg-gray-50">
               <Button
                  onClick={handleSave}
                  className="w-full"
                  disabled={saving}
               >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  {saving ? 'Regenerating...' : 'Apply Changes'}
               </Button>
            </div>
         </div>

         {/* Preview Area */}
         <div className="flex-1 flex flex-col relative">
            <header className="h-14 bg-white border-b flex items-center justify-between px-4 z-10 shadow-sm">
               <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/sites/${siteId}`)}>
                     <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm font-medium">{store.prompt}</span>
               </div>

               <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                  <button
                     onClick={() => setViewMode('desktop')}
                     className={`p-1.5 rounded ${viewMode === 'desktop' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                     <Monitor className="w-4 h-4" />
                  </button>
                  <button
                     onClick={() => setViewMode('mobile')}
                     className={`p-1.5 rounded ${viewMode === 'mobile' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                     <Smartphone className="w-4 h-4" />
                  </button>
               </div>

               <div className="flex gap-2">
                  <Button onClick={publishChanges} className="bg-green-600 hover:bg-green-700 text-white">
                     <Save className="w-4 h-4 mr-2" /> Publish Live
                  </Button>
               </div>
            </header>

            <div className="flex-1 bg-gray-200 overflow-hidden flex items-center justify-center relative p-8">
               <div
                  className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden border-4 border-gray-900 rounded-xl ${viewMode === 'mobile' ? 'w-[375px] h-[700px]' : 'w-full h-full max-w-6xl'
                     }`}
               >
                  {store.preview_url ? (
                     <iframe
                        key={iframeKey}
                        src={store.preview_url}
                        className="w-full h-full border-0 bg-white"
                        title="Website Preview"
                     />
                  ) : (
                     <div className="flex h-full items-center justify-center text-gray-400 flex-col gap-2">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p>Loading preview...</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
