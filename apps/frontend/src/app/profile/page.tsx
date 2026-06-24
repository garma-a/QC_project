import React from 'react';
import { ProfileInfoCard } from '@/features/users/components/ProfileInfoCard';

export const metadata = {
  title: 'My Profile | QC System',
  description: 'Manage your QC system profile and alert preferences',
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your personal information and email alert subscriptions.</p>
      </div>
      
      <ProfileInfoCard />
    </div>
  );
}
