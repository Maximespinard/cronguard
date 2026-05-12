import { SignIn } from '@clerk/clerk-react';

export function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0">
      <div className="animate-fade-in">
        <SignIn
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: '#06b6d4',
              colorBackground: '#18181b',
              colorText: '#fafafa',
              colorTextSecondary: '#a1a1aa',
              colorInputBackground: '#27272a',
              colorInputText: '#fafafa',
              borderRadius: '0.5rem',
            },
            elements: {
              card: 'shadow-2xl border border-zinc-800',
              headerTitle: 'font-display',
              headerSubtitle: 'text-zinc-400',
              formButtonPrimary: 'bg-brand-500 hover:bg-brand-600 transition-colors',
            },
          }}
        />
      </div>
    </div>
  );
}
