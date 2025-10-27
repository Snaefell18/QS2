'use server';

import mql from '@microlink/mql';
import { put } from '@vercel/blob';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

export type ActionResult = {
  ok: boolean;
  error?: string;
  blobUrl?: string;
  usedUrl?: string;
  usedEmail?: string;
};

function normalizeUrl(input: string): string {
  try {
    const u = new URL(input);
    return u.toString();
  } catch {
    try {
      const u = new URL('https://' + input);
      return u.toString();
    } catch {
      throw new Error('Bitte eine gültige URL eingeben.');
    }
  }
}

export async function captureAndStore(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get('email') || '').trim();
  const rawUrl = String(formData.get('url') || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
  }

  let url: string;
  try {
    url = normalizeUrl(rawUrl);
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Ungültige URL.' };
  }

  try {
    // 1) Screenshot via Microlink
    const { data } = await mql(url, {
      screenshot: true,
      // Beispiel-Options:
      // screenshot: { type: 'png', fullPage: true, deviceScaleFactor: 2 },
    });

    const shotUrl: string | undefined =
      (data as any)?.screenshot?.url || (data as any)?.image?.url;

    if (!shotUrl) {
      return { ok: false, error: 'Screenshot konnte nicht erzeugt werden.' };
    }

    // 2) Bildbytes herunterladen
    const resp = await fetch(shotUrl);
    if (!resp.ok) {
      return { ok: false, error: 'Screenshot-Download fehlgeschlagen.' };
    }
    const arrayBuffer = await resp.arrayBuffer();

    // 3) Upload zu Vercel Blob (public)
    const fileName = `screenshots/${Date.now()}.png`;
    const { url: blobUrl } = await put(fileName, new Uint8Array(arrayBuffer), {
      access: 'public',
      contentType: 'image/png'
    });

    // 4) Letzte Eingaben speichern (Cookies, 1 Jahr)
    const oneYear = 60 * 60 * 24 * 365;
    cookies().set('lastEmail', email, { maxAge: oneYear, httpOnly: false, sameSite: 'lax' });
    cookies().set('lastUrl', url, { maxAge: oneYear, httpOnly: false, sameSite: 'lax' });

    // 5) (Optional) Mail mit Resend verschicken – nur wenn Env vorhanden
    const resendKey = process.env.Resend_Mail;
    if (resendKey) {
      const resend = new Resend(resendKey);

      // WICHTIG: Absender-Domain muss bei Resend verifiziert sein!
      // Ersetze die From-Adresse durch deine verifizierte Domain.
      await resend.emails.send({
        from: 'noreply@deine-domain.tld', // ← anpassen (verifizierte Domain)
        to: email,
        subject: 'Dein gespeicherter Screenshot',
        html: `
          <p>Hallo,</p>
          <p>der Screenshot für <code>${url}</code> wurde erstellt und in Vercel Blob gespeichert.</p>
          <p><a href="${blobUrl}">Bild ansehen / herunterladen</a></p>
          <hr />
          <p style="font-size:12px;color:#888">Automatische Benachrichtigung der Microlink Screenshot App</p>
        `
      });
    }

    return { ok: true, blobUrl, usedUrl: url, usedEmail: email };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Unerwarteter Fehler.' };
  }
}
