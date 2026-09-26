import { Lock } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Button, Field, Input, Notice } from '../components/ui';
import { DatabaseService } from '../services/database';

/**
 * LOCAL WORKSPACE LOCK (spec §97). A convenience screen lock for a shared computer — NOT secure
 * authentication. The passphrase hash lives in this browser's IndexedDB; anyone with access to
 * the browser profile or developer tools can bypass it, and it protects nothing on GitHub Pages.
 */
interface LockPref {
  salt: string;
  hash: string;
  iterations: number;
}

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(pass: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, 256);
  return b64(new Uint8Array(bits));
}

export async function setLock(pass: string | null): Promise<void> {
  if (!pass) {
    await DatabaseService.deleteSetting('lock');
    return;
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 210000;
  await DatabaseService.setSetting('lock', { salt: b64(salt), hash: await derive(pass, salt, iterations), iterations } satisfies LockPref);
}

export async function hasLock(): Promise<boolean> {
  return !!(await DatabaseService.getSetting('lock'));
}

export function WorkspaceLockGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    if (sessionStorage.getItem('teal-os-unlocked') === '1') {
      setState('open');
      return;
    }
    void DatabaseService.getSetting('lock').then((p) => setState(p ? 'locked' : 'open'));
  }, []);
  if (state === 'open') return <>{children}</>;
  if (state === 'checking') return null;
  const unlock = async () => {
    const p = await DatabaseService.getSetting<LockPref>('lock');
    if (!p) return setState('open');
    if ((await derive(pass, unb64(p.salt), p.iterations)) === p.hash) {
      try {
        sessionStorage.setItem('teal-os-unlocked', '1');
      } catch {
        /* private mode — stay unlocked for this page only */
      }
      setState('open');
    } else setErr('Passphrase does not match.');
  };
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <form
        className="w-full max-w-sm space-y-3 rounded-lg border border-line bg-panel p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void unlock();
        }}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="size-4" /> LOCAL WORKSPACE LOCK
        </div>
        <Notice tone="warn">This is a convenience lock for this browser only. It is not secure authentication and does not protect data published on GitHub Pages.</Notice>
        <Field label="Passphrase" htmlFor="lock-pass" error={err}>
          <Input id="lock-pass" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary">
          Unlock workspace
        </Button>
      </form>
    </div>
  );
}
