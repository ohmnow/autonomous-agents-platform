'use client';

import { Settings, Bell, User, Shield, Palette, Key } from 'lucide-react';

export default function SettingsPage() {
  const settingsSections = [
    { icon: User, name: 'Profile', description: 'Manage your account details' },
    { icon: Bell, name: 'Notifications', description: 'Configure alert preferences' },
    { icon: Key, name: 'API Keys', description: 'Manage your API credentials' },
    { icon: Shield, name: 'Security', description: 'Password and authentication' },
    { icon: Palette, name: 'Appearance', description: 'Theme and display options' },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
          <Settings className="h-5 w-5 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-zinc-400">Manage your account and preferences</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-500/20 p-2">
            <Settings className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-medium text-amber-400">Coming Soon</h3>
            <p className="text-sm text-zinc-400">
              Settings functionality is currently under development. Check back soon for profile management, 
              API key configuration, and customization options.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <div
            key={section.name}
            className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 opacity-60"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                <section.icon className="h-5 w-5 text-zinc-500" />
              </div>
              <h3 className="font-medium text-zinc-300">{section.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{section.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

