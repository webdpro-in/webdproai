'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Globe, CreditCard, Bell, Shield, Trash2, Loader2, CheckCircle, AlertTriangle, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiStores, apiDomains, apiPayments } from '@/lib/api';

export default function SiteSettingsPage() {
   const params = useParams();
   const router = useRouter();
   const siteId = params.siteId as string;

   const [loading, setLoading] = useState(true);
   const [store, setStore] = useState<any>(null);
   const [activeSection, setActiveSection] = useState<'general' | 'domain' | 'payments' | 'notifications'>('general');

   // Domain State
   const [customDomain, setCustomDomain] = useState('');
   const [domainStatus, setDomainStatus] = useState<any>(null);
   const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);

   // Payment State
   const [paymentForm, setPaymentForm] = useState({
      name: '',
      email: '',
      business_name: '',
      account_number: '',
      ifsc: ''
   });
   const [isPaymentOnboarding, setIsPaymentOnboarding] = useState(false);

   useEffect(() => {
      if (siteId) loadData();
   }, [siteId]);

   const loadData = async () => {
      try {
         const res = await apiStores.getStore(siteId);
         setStore(res.store);
         if (res.store.custom_domain) {
            setCustomDomain(res.store.custom_domain);
            checkDomainStatus();
         }
      } catch (error) {
         console.error('Failed to load settings:', error);
      } finally {
         setLoading(false);
      }
   };

   const checkDomainStatus = async () => {
      try {
         const status = await apiDomains.getDomainStatus(siteId);
         setDomainStatus(status);
      } catch (e) {
         console.error(e);
      }
   };

   const handleConnectDomain = async () => {
      if (!customDomain) return;
      try {
         setIsVerifyingDomain(true);
         const res = await apiDomains.connectDomain(siteId, customDomain);
         if (res.success) {
            await checkDomainStatus();
            alert('Domain connected! Please add the DNS records shown.');
         }
      } catch (e) {
         alert('Failed to connect domain');
      } finally {
         setIsVerifyingDomain(false);
      }
   };

   const handleVerifyDomain = async () => {
      try {
         setIsVerifyingDomain(true);
         const res = await apiDomains.verifyDomain(siteId);
         if (res.verified) {
            alert('Domain Verified Successfully!');
            await checkDomainStatus();
         } else {
            alert('Verification failed. Please check your DNS records and try again.');
         }
      } catch (e) {
         alert('Verification check failed');
      } finally {
         setIsVerifyingDomain(false);
      }
   };

   const handlePaymentOnboard = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsPaymentOnboarding(true);
      try {
         // Mock tenant ID form store or auth context
         const tenantId = store.tenant_id;
         await apiPayments.onboardMerchant({
            tenant_id: tenantId,
            name: paymentForm.name,
            email: paymentForm.email,
            business_name: paymentForm.business_name
         });
         alert('Payment onboarding initiation successful!');
      } catch (e) {
         alert('Failed to submit payment details');
      } finally {
         setIsPaymentOnboarding(false);
      }
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
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
                  <h1 className="text-2xl font-bold text-gray-900">{store.prompt || 'Store'} - Settings</h1>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
               <nav className="space-y-1 bg-white rounded-lg border border-gray-200 p-2">
                  {[
                     { id: 'general', icon: Shield, label: 'General' },
                     { id: 'domain', icon: Globe, label: 'Domain' },
                     { id: 'payments', icon: CreditCard, label: 'Payments' },
                     { id: 'notifications', icon: Bell, label: 'Notifications' }
                  ].map((item) => (
                     <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id as any)}
                        className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
                           }`}
                     >
                        <item.icon className="w-4 h-4 inline mr-2" />
                        {item.label}
                     </button>
                  ))}
               </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
               <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 min-h-[500px]">
                  {activeSection === 'general' && (
                     <div className="space-y-6">
                        <div>
                           <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
                           <div className="space-y-4 max-w-md">
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                                 <Input defaultValue={store.prompt} disabled />
                              </div>
                              <Button>Save Changes</Button>
                           </div>
                        </div>
                        <div className="pt-6 border-t border-gray-200">
                           <h3 className="text-base font-semibold text-red-600 mb-2">Danger Zone</h3>
                           <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Website
                           </Button>
                        </div>
                     </div>
                  )}

                  {activeSection === 'domain' && (
                     <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Domain Settings</h2>
                        <div className="space-y-6 max-w-2xl">
                           {/* Default Domain */}
                           <div className="p-4 bg-gray-50 border rounded-lg flex justify-between items-center">
                              <div>
                                 <p className="text-xs text-gray-500 uppercase font-semibold">Default Domain</p>
                                 <p className="font-mono text-sm mt-1">{store.live_url || 'Not published yet'}</p>
                              </div>
                              {store.live_url && <a href={store.live_url} target="_blank" className="text-indigo-600 text-sm hover:underline">Visit</a>}
                           </div>

                           {/* Custom Domain Input */}
                           <div className="space-y-4">
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
                                 <div className="flex gap-2">
                                    <Input
                                       placeholder="e.g. mystore.com"
                                       value={customDomain}
                                       onChange={(e) => setCustomDomain(e.target.value)}
                                       disabled={!!store.custom_domain}
                                    />
                                    {!store.custom_domain && (
                                       <Button onClick={handleConnectDomain} disabled={isVerifyingDomain}>
                                          {isVerifyingDomain ? <Loader2 className="animate-spin w-4 h-4" /> : 'Connect'}
                                       </Button>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {/* DNS Records Table */}
                           {domainStatus && (
                              <div className="border rounded-lg overflow-hidden">
                                 <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                                    <h3 className="font-medium text-sm">DNS Configuration</h3>
                                    <div className="flex items-center gap-2">
                                       <span className={`text-xs px-2 py-1 rounded-full ${domainStatus.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                          {domainStatus.status.toUpperCase()}
                                       </span>
                                       <Button size="sm" variant="outline" onClick={handleVerifyDomain} disabled={isVerifyingDomain || domainStatus.status === 'verified'}>
                                          <RefreshCw className={`w-3 h-3 mr-1 ${isVerifyingDomain ? 'animate-spin' : ''}`} /> Verify
                                       </Button>
                                    </div>
                                 </div>
                                 {domainStatus.status !== 'verified' && (
                                    <div className="p-4 bg-yellow-50 text-sm text-yellow-800">
                                       <AlertTriangle className="w-4 h-4 inline mr-1" />
                                       Add the following CNAME record to your DNS provider to verify ownership.
                                    </div>
                                 )}
                                 <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500">
                                       <tr>
                                          <th className="px-4 py-2">Type</th>
                                          <th className="px-4 py-2">Name</th>
                                          <th className="px-4 py-2">Value</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                       <tr>
                                          <td className="px-4 py-3 font-mono">CNAME</td>
                                          <td className="px-4 py-3 font-mono">www</td>
                                          <td className="px-4 py-3 font-mono break-all">{store.live_url ? new URL(store.live_url).hostname : '...'}</td>
                                       </tr>
                                       {/* If ACM returns records, we map them here. Assuming simplified CNAME flow for now. */}
                                    </tbody>
                                 </table>
                              </div>
                           )}
                        </div>
                     </div>
                  )}

                  {activeSection === 'payments' && (
                     <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Settings (Razorpay)</h2>
                        <div className="space-y-6 max-w-xl">
                           <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                              Connect your Razorpay account to receive payments directly.
                           </div>

                           <form onSubmit={handlePaymentOnboard} className="space-y-4">
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                 <Input required value={paymentForm.name} onChange={e => setPaymentForm({ ...paymentForm, name: e.target.value })} />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                 <Input type="email" required value={paymentForm.email} onChange={e => setPaymentForm({ ...paymentForm, email: e.target.value })} />
                              </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                 <Input required value={paymentForm.business_name} onChange={e => setPaymentForm({ ...paymentForm, business_name: e.target.value })} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                                    <Input required value={paymentForm.account_number} onChange={e => setPaymentForm({ ...paymentForm, account_number: e.target.value })} />
                                 </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                                    <Input required value={paymentForm.ifsc} onChange={e => setPaymentForm({ ...paymentForm, ifsc: e.target.value })} />
                                 </div>
                              </div>

                              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isPaymentOnboarding}>
                                 {isPaymentOnboarding ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                                 {isPaymentOnboarding ? 'Submitting...' : 'Connect Razorpay'}
                              </Button>
                           </form>
                        </div>
                     </div>
                  )}

                  {activeSection === 'notifications' && (
                     <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
                        <p className="text-gray-500">Manage your email preferences.</p>
                        {/* Placeholder */}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
