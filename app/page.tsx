import { cookies } from 'next/headers';
import ClientForm from './ClientForm';

const DEFAULT_EMAIL = 'jan.rentzsch@googlemail.com';
const DEFAULT_URL = 'https://www.wsj.com/market-data/currencies/exchangerates';

export const dynamic = 'force-dynamic';

function readServerDefaults() {
  const c = cookies();
  const lastEmail = c.get('lastEmail')?.value || '';
  const lastUrl = c.get('lastUrl')?.value || '';
  return {
    email: lastEmail || DEFAULT_EMAIL,
    url: lastUrl || DEFAULT_URL,
  };
}

export default function Page() {
  const { email, url } = readServerDefaults();
  return <ClientForm initialEmail={email} initialUrl={url} />;
}

function ClientForm({ initialEmail, initialUrl }: { initialEmail: string; initialUrl: string }) {
  'use client';

  const [state, formAction] = useActionState<ActionResult, FormData>(captureAndStore, null);
  const [email, setEmail] = useState<string>(initialEmail);
  const [url, setUrl] = useState<string>(initialUrl);

  // localStorage → Prefill fallback
  useEffect(() => {
    try {
      const lsEmail = localStorage.getItem('lastEmail');
      const lsUrl = localStorage.getItem('lastUrl');
      if (lsEmail && lsEmail !== email) setEmail(lsEmail);
      if (lsUrl && lsUrl !== url) setUrl(lsUrl);
    } catch {}
  }, []);

  // live schreiben
  useEffect(() => {
    try {
      localStorage.setItem('lastEmail', email);
      localStorage.setItem('lastUrl', url);
    } catch {}
  }, [email, url]);

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px', fontFamily: 'ui-sans-serif, system-ui' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>URL Screenshot → Vercel Blob</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Gib eine E-Mail & eine Website-URL ein. Wir machen per Microlink einen Screenshot, speichern ihn in Vercel Blob
        und zeigen ihn hier an.
      </p>

      <form action={formAction} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>E-Mail</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            placeholder="E-Mail eingeben"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc' }}
            required
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>URL</span>
          <input
            type="url"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
            placeholder="https://..."
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc' }}
            required
          />
        </label>

        <button
          type="submit"
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid #111',
            background: '#111',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            width: 'fit-content'
          }}
        >
          Screenshot erstellen & speichern
        </button>
      </form>

      {state?.error && (
        <p style={{ color: '#b00020', marginTop: 16 }}>⚠️ {state.error}</p>
      )}

      {state?.ok && state.blobUrl && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Gespeichertes Bild</h2>
          <a href={state.blobUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginBottom: 8 }}>
            In neuem Tab öffnen
          </a>
          <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
            <img src={state.blobUrl} alt="Website Screenshot" style={{ display: 'block', width: '100%', height: 'auto' }} />
          </div>
        </section>
      )}

      <footer style={{ marginTop: 40, fontSize: 12, color: '#777' }}>
        <div>Letzte verwendete E-Mail: <strong>{state?.usedEmail || email}</strong></div>
        <div>Letzte verwendete URL: <strong>{state?.usedUrl || url}</strong></div>
      </footer>
    </main>
  );
}

export default function Page() {
  const { email, url } = readServerDefaults();
  return <ClientForm initialEmail={email} initialUrl={url} />;
}
