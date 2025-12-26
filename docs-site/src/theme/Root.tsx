import React, { useState, useEffect, type ReactNode } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

interface PasswordGateProps {
  children: ReactNode;
}

// Simple password gate - for basic access control only
// Not suitable for truly sensitive data
const PASSWORD_HASH = 'docs2024'; // Change this to your desired password

function PasswordGateContent({ children }: PasswordGateProps): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already authenticated
    const stored = localStorage.getItem('docs_auth');
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD_HASH) {
      localStorage.setItem('docs_auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--ifm-background-color)',
        fontFamily: 'var(--ifm-font-family-base)',
      }}
    >
      <div
        style={{
          padding: '2rem',
          borderRadius: '8px',
          backgroundColor: 'var(--ifm-card-background-color)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        <h1 style={{ marginBottom: '1rem', textAlign: 'center' }}>
          🔒 Documentation Access
        </h1>
        <p
          style={{
            color: 'var(--ifm-color-emphasis-700)',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          This documentation is private. Please enter the password to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: '4px',
              fontSize: '1rem',
              backgroundColor: 'var(--ifm-background-surface-color)',
              color: 'var(--ifm-font-color-base)',
            }}
            autoFocus
          />
          {error && (
            <p
              style={{
                color: 'var(--ifm-color-danger)',
                marginBottom: '1rem',
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--ifm-color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Access Documentation
          </button>
        </form>
      </div>
    </div>
  );
}

// Wrap in BrowserOnly to avoid SSR issues with localStorage
export default function Root({ children }: { children: ReactNode }): JSX.Element {
  // Set this to false to disable password protection
  const ENABLE_PASSWORD_PROTECTION = true;

  if (!ENABLE_PASSWORD_PROTECTION) {
    return <>{children}</>;
  }

  return (
    <BrowserOnly fallback={<div>Loading...</div>}>
      {() => <PasswordGateContent>{children}</PasswordGateContent>}
    </BrowserOnly>
  );
}

