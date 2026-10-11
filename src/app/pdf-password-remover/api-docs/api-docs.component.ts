import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiDocsService } from 'src/app/core/service/pdf-api-docs/api-docs.service';

export type ErrorSample = { title: string; status: number; body: string };
export type Endpoint = {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
  title: string;
  path: string;
  description: string;
  headers: { name: string; desc: string }[];
  form?: { name: string; desc: string }[];
  success?: string;
  errors?: ErrorSample[];
  samples: Record<string, string>; // NEW: language -> code snippet
  sampleLangs: string[]; // NEW: order of tabs
};

/**
 * Stored in localStorage. Deliberately excludes the API secret: secrets are
 * shown once after creation, kept only in memory and never persisted.
 */
export type StoredKey = {
  api_key: string;
  created_at: string;
  name: string;
};

/** Newly created key, held in memory only until both values are copied. */
export type CreatedKeyView = StoredKey & { api_secret: string };

@Component({
  selector: 'app-api',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './api-docs.component.html',
  styleUrls: ['./api-docs.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ApiDocsComponent implements OnInit, OnDestroy {
  /** Form state */
  partnerLabel = '';
  partnerLabelTouched = false;
  submitted = false;
  busy = false;
  error = '';
  toastVisible = false;

  /** Copy section state */
  lastCreatedCopySection?: CreatedKeyView;
  copied = { api_key: false, api_secret: false };

  /** Persisted keys */
  storedKeys: StoredKey[] = [];

  /** Endpoint data + tab state */
  readonly removeHmacUrl = '/api/v1/remove_password';
  endpoints: Endpoint[] = [];
  private activeTabs: Record<string, 'req' | 'res' | 'err'> = {};
  private activeCodeTabs: Record<string, string> = {}; // ep.id -> lang

  /** localStorage key */
  private readonly STORAGE_LIST_KEY = 'pdftools:keys';

  /** name validation (lowercase letters, digits, hyphens; 1–16 chars) */
  private readonly NAME_RE = /^[a-z0-9-]{1,16}$/;

  constructor(
    private readonly svc: ApiDocsService,
    private readonly elRef: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) { }

  ngOnInit(): void {
    this.endpoints = this.buildEndpoints();
    this.endpoints.forEach((ep) => {
      this.activeTabs[ep.id] = 'req';
      this.activeCodeTabs[ep.id] = ep.sampleLangs[0]; // default first lang
    });
    this.loadStored();
  }

  ngOnDestroy(): void {
    // Drop the in-memory secret when leaving the page.
    this.lastCreatedCopySection = undefined;
  }

  /** Validation */
  get partnerLabelError(): string {
    const v = (this.partnerLabel || '').trim();
    if (!v) return 'Partner label is required.';
    if (v !== v.toLowerCase()) return 'Use lowercase letters only.';
    if (!this.NAME_RE.test(v))
      return '1–16 chars; lowercase letters, digits, or hyphens only.';
    return '';
  }
  get canCreate(): boolean {
    return !this.busy && !this.partnerLabelError;
  }

  /** Build endpoint content with language samples */
  private buildEndpoints(): Endpoint[] {
    const path = this.removeHmacUrl;

    const python = [
      `import time, hmac, hashlib, requests, os
from requests_toolbelt import MultipartEncoder

API_KEY = "<your_api_key>"
API_SECRET = "<your_api_secret>"
PATH = "${path}"
URL  = "https://api.yourdomain.com" + PATH

FILE_PATH = "protected.pdf"
PDF_PASSWORD = "mypassword"

m = MultipartEncoder(fields={
    "file": (os.path.basename(FILE_PATH), open(FILE_PATH, "rb"), "application/pdf"),
    "password": PDF_PASSWORD,
})
body = m.to_string()
body_hash = hashlib.sha256(body).hexdigest()
ts = str(int(time.time()))
msg = f"POST\\n{PATH}\\n{ts}\\n{body_hash}"
sig = hmac.new(API_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()

headers = {
    "X-API-KEY": API_KEY,
    "X-API-TIMESTAMP": ts,
    "X-API-SIGNATURE": sig,
    "Content-Type": m.content_type,
}

r = requests.post(URL, headers=headers, data=body, timeout=180)
if r.ok and r.headers.get("Content-Type","").startswith("application/pdf"):
    open("unlocked.pdf", "wb").write(r.content)
else:
    print(r.status_code, r.text)`,
    ].join('\n');

    const node = [
      `import fs from "fs";
import crypto from "crypto";
import fetch from "node-fetch";
import FormData from "form-data";

const API_KEY = "<your_api_key>";
const API_SECRET = "<your_api_secret>";
const PATH = "${path}";
const URL  = "https://api.yourdomain.com" + PATH;

const form = new FormData();
form.append("file", fs.createReadStream("protected.pdf"), { filename: "protected.pdf", contentType: "application/pdf" });
form.append("password", "mypassword");

// Collect exact bytes to hash
const chunks = [];
await new Promise((res, rej) => {
  form.on("data", c => chunks.push(c));
  form.on("end", res);
  form.on("error", rej);
  form.pipe(fs.createWriteStream(process.platform === "win32" ? "NUL" : "/dev/null"));
});
const body = Buffer.concat(chunks);

const ts  = Math.floor(Date.now()/1000).toString();
const bodyHash = crypto.createHash("sha256").update(body).digest("hex");
const sig = crypto.createHmac("sha256", API_SECRET).update(\`POST\\n\${PATH}\\n\${ts}\\n\${bodyHash}\`).digest("hex");

const headers = { "X-API-KEY": API_KEY, "X-API-TIMESTAMP": ts, "X-API-SIGNATURE": sig, ...form.getHeaders() };
const resp = await fetch(URL, { method: "POST", headers, body });
if (resp.ok && resp.headers.get("content-type")?.startsWith("application/pdf")) {
  fs.writeFileSync("unlocked.pdf", Buffer.from(await resp.arrayBuffer()));
} else {
  console.log(resp.status, await resp.text());
}`,
    ].join('\n');

    const go = [
      `package main

import (
  "bytes"
  "crypto/hmac"
  "crypto/sha256"
  "encoding/hex"
  "fmt"
  "io"
  "mime/multipart"
  "net/http"
  "os"
  "path/filepath"
  "time"
)

func main() {
  apiKey := "<your_api_key>"
  apiSecret := "<your_api_secret>"
  path := "${path}"
  url := "https://api.yourdomain.com" + path

  var buf bytes.Buffer
  mw := multipart.NewWriter(&buf)

  f, _ := os.Open("protected.pdf")
  defer f.Close()
  fw, _ := mw.CreateFormFile("file", filepath.Base("protected.pdf"))
  io.Copy(fw, f)

  mw.WriteField("password", "mypassword")
  mw.Close()

  h := sha256.Sum256(buf.Bytes())
  ts := fmt.Sprintf("%d", time.Now().Unix())
  msg := fmt.Sprintf("POST\\n%s\\n%s\\n%s", path, ts, hex.EncodeToString(h[:]))

  mac := hmac.New(sha256.New, []byte(apiSecret))
  mac.Write([]byte(msg))
  sig := hex.EncodeToString(mac.Sum(nil))

  req, _ := http.NewRequest("POST", url, bytes.NewReader(buf.Bytes()))
  req.Header.Set("X-API-KEY", apiKey)
  req.Header.Set("X-API-TIMESTAMP", ts)
  req.Header.Set("X-API-SIGNATURE", sig)
  req.Header.Set("Content-Type", mw.FormDataContentType())

  resp, err := http.DefaultClient.Do(req)
  if err != nil { panic(err) }
  defer resp.Body.Close()

  if resp.StatusCode == 200 && resp.Header.Get("Content-Type") == "application/pdf" {
    out, _ := os.Create("unlocked.pdf")
    io.Copy(out, resp.Body)
    out.Close()
  } else {
    b, _ := io.ReadAll(resp.Body)
    fmt.Println(resp.StatusCode, string(b))
  }
}`,
    ].join('\n');

    const success = `HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="unlocked.pdf"
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: <epoch>

%PDF-1.7 ... (binary)`;

    const errors: ErrorSample[] = [
      {
        title: 'Bad signature',
        status: 401,
        body: [
          'HTTP/1.1 401 Unauthorized',
          'Content-Type: application/json',
          '',
          '{',
          '  "error": "bad_signature: HMAC does not match. Recompute using UPPER(method)\\npath\\ntimestamp\\nsha256_hex(raw_body) with your plaintext api_secret.",',
          '}',
        ].join('\n'),
      },
      {
        title: 'Timestamp skew',
        status: 401,
        body: [
          'HTTP/1.1 401 Unauthorized',
          'Content-Type: application/json',
          '',
          '{',
          '  "error": "skew: Timestamp outside allowed window (±300s). Use current UNIX seconds or ISO-8601 UTC.",',
          '}',
        ].join('\n'),
      },
      {
        title: 'Missing file or password',
        status: 400,
        body: [
          'HTTP/1.1 400 Bad Request',
          'Content-Type: application/json',
          '',
          '{',
          '  "error": "Missing file or password"',
          '}',
        ].join('\n'),
      },
      {
        title: 'Incorrect password',
        status: 400,
        body: [
          'HTTP/1.1 400 Bad Request',
          'Content-Type: application/json',
          '',
          '{',
          '  "error": "Incorrect password"',
          '}',
        ].join('\n'),
      },
      {
        title: 'Only PDF files are supported',
        status: 400,
        body: [
          'HTTP/1.1 400 Bad Request',
          'Content-Type: application/json',
          '',
          '{',
          '  "error": "Only PDF files are supported"',
          '}',
        ].join('\n'),
      },
      {
        title: 'Too many requests today',
        status: 429,
        body: [
          'HTTP/1.1 429 Too Many Requests',
          'Content-Type: application/json',
          '',
          '{',
          '  "error": "daily_quota_exceeded",',
          '  "message": "You have exceeded your daily API calls"',
          '}',
        ].join('\n'),
      },
      {
        title: 'Processing timeout',
        status: 504,
        body: [
          'HTTP/1.1 504 Gateway Timeout',
          'Content-Type: application/json',
          '',
          '{',
          '  "error": "processing_timeout"',
          '}',
        ].join('\n'),
      },
    ];

    return [
      {
        id: 'remove-password',
        method: 'POST',
        title: 'Remove PDF Password',
        path,
        description:
          'Upload a password-protected PDF and receive the unlocked file. One PDF and one password per request.',
        headers: [
          { name: 'X-API-KEY', desc: 'Your issued key id' },
          {
            name: 'X-API-TIMESTAMP',
            desc: 'UNIX seconds or ISO-8601 UTC (±300s)',
          },
          {
            name: 'X-API-SIGNATURE',
            desc: 'hex HMAC-SHA256 of UPPER(method)\\npath\\ntimestamp\\nsha256_hex(raw_body)',
          },
          {
            name: 'Content-Type',
            desc: 'multipart/form-data (the request body you signed)',
          },
        ],
        form: [
          { name: 'file', desc: 'PDF file (required)' },
          { name: 'password', desc: 'Current PDF password (required)' },
        ],
        success,
        errors,
        samples: {
          Python: python,
          'Node.js': node,
          Go: go,
        },
        sampleLangs: ['Python', 'Node.js', 'Go'],
      },
    ];
  }

  /** Create key -> persist -> show copy section */
  async create(): Promise<void> {
    this.submitted = true;
    this.error = '';
    const err = this.partnerLabelError;
    if (err) return;

    this.busy = true;
    try {
      const name = this.partnerLabel.trim().toLowerCase();
      const data = await firstValueFrom(this.svc.createKey(name));
      const newItem: StoredKey = {
        api_key: data.api_key,
        created_at: data.created_at,
        name: data.name,
      };
      this.storedKeys.unshift(newItem);
      this.saveStored(); // the secret is never persisted

      this.lastCreatedCopySection = { ...newItem, api_secret: data.api_secret };
      this.copied = { api_key: false, api_secret: false };

      this.partnerLabel = '';
      this.partnerLabelTouched = false;
      this.submitted = false;
    } catch (e: any) {
      this.error = this.readHttpError(e, 'Create failed');
    } finally {
      this.busy = false;
    }
  }

  /** Copy section logic: hide only after BOTH copied */
  async copyFromCopySection(field: 'api_key' | 'api_secret'): Promise<void> {
    if (!this.lastCreatedCopySection) return;
    const value = this.lastCreatedCopySection[field];
    await this.copy(value);
    this.copied[field] = true;
    if (this.copied.api_key && this.copied.api_secret) {
      this.lastCreatedCopySection = undefined;
    }
  }

  /**
   * Delete flow. Deleting requires proof of the key's secret: the browser signs
   * the request (HMAC-SHA256 via Web Crypto). The secret is used only for this
   * signature and is not stored or sent.
   */
  async confirmDelete(item: StoredKey): Promise<void> {
    if (!item?.api_key) return;
    const secret = (window.prompt(
      'To delete this API key, paste its API secret. It is only used to sign the delete request in your browser and is not stored or sent.'
    ) || '').trim();
    if (!secret) return;

    this.busy = true;
    try {
      const path = `/api/keys/${encodeURIComponent(item.api_key)}`;
      const ts = Math.floor(Date.now() / 1000).toString();
      const signature = await signHmacRequest('DELETE', path, ts, secret);
      await firstValueFrom(this.svc.deleteKey(item.api_key, ts, signature));
      this.storedKeys = this.storedKeys.filter(
        (k) => k.api_key !== item.api_key
      );
      this.saveStored();
      if (this.lastCreatedCopySection?.api_key === item.api_key) {
        this.lastCreatedCopySection = undefined;
      }
    } catch (e: any) {
      this.error = this.readHttpError(e, 'Delete failed');
    } finally {
      this.busy = false;
    }
  }

  /** Tabs */
  setTab(id: string, tab: 'req' | 'res' | 'err') {
    this.activeTabs[id] = tab;
  }
  isActive(id: string, tab: 'req' | 'res' | 'err') {
    return this.activeTabs[id] === tab;
  }

  setCodeTab(id: string, lang: string) {
    this.activeCodeTabs[id] = lang;
  }
  isCodeTab(id: string, lang: string) {
    return this.activeCodeTabs[id] === lang;
  }
  activeCodeTabLabel(id: string) {
    return this.activeCodeTabs[id] || '';
  }
  activeSample(ep: Endpoint) {
    const lang = this.activeCodeTabs[ep.id] || ep.sampleLangs[0];
    return ep.samples[lang];
  }

  /** UX helpers */
  trackByTitle = (_: number, e: ErrorSample) => e.title;
  trackByPath = (_: number, ep: Endpoint) => ep.path;
  trackByKey = (_: number, k: StoredKey) => k.api_key;

  scrollTo(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = this.elRef.nativeElement;
    const el = id === 'top' ? root : document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async copy(value: string): Promise<void> {
    try {
      if (!value) return;
      if ((navigator as any)?.clipboard?.writeText) {
        await (navigator as any).clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.className = 'clipboard-helper';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.flashToast();
    } catch { }
  }

  private flashToast(): void {
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 1400);
  }

  /** Shows only the backend's user-facing message; never raw URLs or internals. */
  private readHttpError(e: any, fallback: string): string {
    const body = e?.error;
    if (body && typeof body.message === 'string' && body.message.length < 200) return body.message;
    const known: Record<string, string> = {
      name_required: 'Please enter a label.',
      name_invalid: 'Use 1-16 lowercase letters, digits or hyphens.',
      name_taken: 'This label is already in use. Choose a different one.',
      bad_signature: 'That secret does not match this key.',
      bad_api_key: 'This key does not exist or is already deleted.',
      not_found: 'This key does not exist or is already deleted.',
    };
    const code = typeof body?.error === 'string' ? body.error.split(':')[0] : '';
    if (known[code]) return known[code];
    if (e?.status === 429) return 'Too many requests. Please wait a minute and try again.';
    if (e?.status === 0) return 'Could not reach the API server. Please try again.';
    return fallback;
  }

  /** localStorage */
  private loadStored(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(this.STORAGE_LIST_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      // Keep only the safe fields; this also purges secrets saved by older versions.
      this.storedKeys = (Array.isArray(parsed) ? parsed : [])
        .filter((k): k is Record<string, unknown> => !!k && typeof k === 'object' && typeof (k as any).api_key === 'string')
        .map((k) => ({
          api_key: String(k['api_key']).slice(0, 64),
          name: typeof k['name'] === 'string' ? k['name'].slice(0, 32) : '',
          created_at: typeof k['created_at'] === 'string' ? k['created_at'].slice(0, 40) : '',
        }));
      if (raw && raw.includes('api_secret')) this.saveStored();
    } catch {
      this.storedKeys = [];
      try { localStorage.removeItem(this.STORAGE_LIST_KEY); } catch { }
    }
  }
  private saveStored(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(
        this.STORAGE_LIST_KEY,
        JSON.stringify(this.storedKeys)
      );
    } catch { }
  }

  /** mask helper for table display */
  mask(v: string, keepStart = 4, keepEnd = 4): string {
    if (!v) return '';
    if (v.length <= keepStart + keepEnd) return v;
    const start = v.slice(0, keepStart);
    const end = v.slice(-keepEnd);
    return `${start}••••••••${end}`;
  }
}

/** HMAC-SHA256 over UPPER(method), path, timestamp and sha256_hex(empty body), joined by newlines; hex-encoded. */
export async function signHmacRequest(method: string, path: string, ts: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
  const bodyHash = hex(await crypto.subtle.digest('SHA-256', new Uint8Array()));
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const msg = [method.toUpperCase(), path, ts, bodyHash].join('\n');
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
