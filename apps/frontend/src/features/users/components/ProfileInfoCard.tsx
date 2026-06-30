'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { DoctorAvatar } from '@/components/ui/DoctorAvatar';
import { Badge } from '@/components/ui/badge';

export function ProfileInfoCard() {
  const { data: profile, isLoading, isError } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    emailNotificationsEnabled: false,
    subscribeToAllSections: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        emailNotificationsEnabled: profile.emailNotificationsEnabled,
        subscribeToAllSections: profile.subscribeToAllSections,
      });
    }
  }, [profile]);

  if (isLoading) return <div>Loading profile...</div>;
  if (isError || !profile) return <div>Error loading profile data.</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in zoom-in duration-500">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-[2rem] blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <Card className="relative bg-white dark:bg-[#121212] backdrop-blur-xl border-gray-200/50 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
          
          {/* Header Section - Clean & Light with Red Accent */}
          <div className="relative h-44 bg-slate-50 dark:bg-[#1a1a1a] overflow-hidden border-b border-gray-100 dark:border-gray-800">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#c41e3a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            {/* Soft Red Accent Gradient */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#c41e3a] opacity-[0.04] dark:opacity-[0.07] rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-[#003366] dark:bg-[#4a90e2] opacity-[0.03] dark:opacity-[0.05] rounded-full blur-3xl"></div>
            
            <div className="absolute bottom-8 left-8 flex items-end gap-6">
              <div className="relative z-10">
                <div className="w-28 h-28 rounded-full border-4 border-white dark:border-[#121212] shadow-xl overflow-hidden bg-white">
                  <DoctorAvatar className="w-full h-full" />
                </div>
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-2 border-white dark:border-[#121212] rounded-full shadow-sm"></div>
              </div>
              <div className="mb-2">
                <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white drop-shadow-sm">My Profile</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide text-sm mt-1">Manage your personal information and preferences.</p>
              </div>
            </div>
          </div>

          <CardContent className="p-8 pt-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Personal Info Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700 pb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group/input">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">First Name</label>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="bg-gray-50/50 dark:bg-black/20 border-gray-200 dark:border-gray-800 focus:ring-[#c41e3a] focus:border-[#c41e3a] dark:focus:ring-[#e84855] dark:focus:border-[#e84855] transition-all rounded-xl h-12 px-4 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2 group/input">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Name</label>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="bg-gray-50/50 dark:bg-black/20 border-gray-200 dark:border-gray-800 focus:ring-[#c41e3a] focus:border-[#c41e3a] dark:focus:ring-[#e84855] dark:focus:border-[#e84855] transition-all rounded-xl h-12 px-4 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2 group/input">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</label>
                    <Input
                      name="email"
                      value={profile.email}
                      disabled
                      className="bg-gray-100/80 dark:bg-black/40 border-transparent text-gray-500 cursor-not-allowed rounded-xl h-12 px-4"
                    />
                  </div>
                  <div className="space-y-2 group/input">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone Number</label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="bg-gray-50/50 dark:bg-black/20 border-gray-200 dark:border-gray-800 focus:ring-[#c41e3a] focus:border-[#c41e3a] dark:focus:ring-[#e84855] dark:focus:border-[#e84855] transition-all rounded-xl h-12 px-4 shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Email Notifications & Subscriptions */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-[#c41e3a] dark:text-[#e84855] uppercase tracking-widest border-b border-[#c41e3a]/10 dark:border-[#e84855]/20 pb-2">
                  Alert Preferences
                </h3>
                
                <div className="space-y-4">
                  <div className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                    formData.emailNotificationsEnabled 
                      ? 'bg-[#c41e3a]/5 dark:bg-[#e84855]/10 border-[#c41e3a]/30 dark:border-[#e84855]/30'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10'
                  }`}>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-base">Enable Email Alerts</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Receive immediate QC alerts directly to your inbox.</p>
                    </div>
                    <Switch
                      checked={formData.emailNotificationsEnabled}
                      onCheckedChange={handleSwitchChange('emailNotificationsEnabled')}
                      className="data-[state=checked]:bg-[#c41e3a] dark:data-[state=checked]:bg-[#e84855]"
                    />
                  </div>

                  {formData.emailNotificationsEnabled && (
                    <div className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between animate-in slide-in-from-top-2 opacity-0 fill-mode-forwards ${
                      formData.subscribeToAllSections
                        ? 'bg-[#003366]/5 dark:bg-[#4a90e2]/10 border-[#003366]/30 dark:border-[#4a90e2]/30'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10'
                    }`}>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-base">Subscribe to All Sections</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Receive alerts for every laboratory section across the entire center.</p>
                      </div>
                      <Switch
                        checked={formData.subscribeToAllSections}
                        onCheckedChange={handleSwitchChange('subscribeToAllSections')}
                        className="data-[state=checked]:bg-[#003366] dark:data-[state=checked]:bg-[#4a90e2]"
                      />
                    </div>
                  )}
                </div>

                {!formData.subscribeToAllSections && (
                  <div className="pt-2 animate-in fade-in duration-500">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Your Assigned Sections</h4>
                    {profile.assignedSections.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {profile.assignedSections.map((sec) => (
                          <Badge 
                            key={sec.id} 
                            variant="secondary" 
                            className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform"
                          >
                            <span className="w-2 h-2 rounded-full bg-[#c41e3a] dark:bg-[#e84855] mr-2 animate-pulse"></span>
                            {sec.name} {sec.specialization ? `(${sec.specialization})` : ''}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-amber-800 dark:text-amber-300 text-sm flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <p>No sections currently assigned. You will not receive any alerts unless you enable "Subscribe to All Sections".</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="relative group overflow-hidden bg-[#c41e3a] hover:bg-[#a01830] dark:bg-[#e84855] dark:hover:bg-[#d63b48] text-white px-8 py-6 rounded-xl font-bold shadow-[0_0_20px_rgba(196,30,58,0.3)] dark:shadow-[0_0_20px_rgba(232,72,85,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {updateProfile.isPending ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Saving Changes...
                      </>
                    ) : (
                      <>Save Profile Changes</>
                    )}
                  </span>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
