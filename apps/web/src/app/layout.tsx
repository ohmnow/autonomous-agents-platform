import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import './globals.css';

export const metadata: Metadata = {
  title: 'Autonomous Agents Platform',
  description: 'Build applications with autonomous AI agents',
};

// Force dynamic rendering when Clerk keys are not available
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if Clerk is configured
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // If Clerk is not configured, render without it (for development/build)
  if (!clerkPublishableKey || clerkPublishableKey.includes('your_key_here')) {
    return (
      <html lang="en" className="dark">
        <body className="min-h-screen bg-background font-sans antialiased">
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#38bdf8',
          colorBackground: '#171717',
          colorText: '#fafafa',
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="min-h-screen bg-background font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
