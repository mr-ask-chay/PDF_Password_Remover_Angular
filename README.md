<p align="center">
  <a href="https://pdf-fe-kappa.vercel.app/">
    <img src="src/assets/brand/unclasp-logo.svg" alt="Unclasp" height="64" />
  </a>
</p>

<p align="center">
  <strong>Remove the password from a PDF you have the password for — free, no sign-up.</strong>
</p>

<p align="center">
  <a href="https://pdf-fe-kappa.vercel.app/"><strong>Live site</strong></a> ·
  <a href="https://pdf-fe-kappa.vercel.app/pdf-password-remover">PDF Password Remover</a> ·
  <a href="https://pdf-fe-kappa.vercel.app/docs">API Docs</a> ·
  <a href="https://pdf-fe-kappa.vercel.app/privacy">Privacy</a>
</p>

---

# Unclasp — PDF Password Remover

Unclasp is a free web tool for unlocking password-protected PDFs such as bank
statements, payslips and invoices. Upload the PDF, enter the password you
already know, and download a copy that opens without it.

👉 **Try it: [pdf-fe-kappa.vercel.app/pdf-password-remover](https://pdf-fe-kappa.vercel.app/pdf-password-remover)**

![Unclasp preview](src/assets/brand/og-image.png)

## Features

- **Remove a PDF open password** when you know the current password.
- **No account, no watermark** — free to use.
- **Passwords not stored** — PDFs are unlocked on the server in memory; the
  application does not save your PDF, its filename or password, or write them
  to its logs. See the [privacy policy](https://pdf-fe-kappa.vercel.app/privacy).
- **Developer API** — HMAC-SHA256 authenticated endpoint with Python, Node.js
  and Go examples. See the [API docs](https://pdf-fe-kappa.vercel.app/docs).
- **Responsive** with light and dark themes.

> Unclasp does **not** crack or recover forgotten passwords. Use it only on
> documents you own or are authorised to modify.

## Tech stack

| Part | Stack | Repository |
| --- | --- | --- |
| Frontend (this repo) | Angular 19, SSR prerendering, Bootstrap, Angular Material | [PDF_Password_Remover_Angular](https://github.com/mr-ask-chay/PDF_Password_Remover_Angular) |
| Backend | Flask (Python) | [PDF_Password_Remover_Flask](https://github.com/mr-ask-chay/PDF_Password_Remover_Flask) |
| Hosting | Vercel (frontend), Render (backend) | — |

## Run locally

Requires Node.js 20+.

```bash
git clone https://github.com/mr-ask-chay/PDF_Password_Remover_Angular.git
cd PDF_Password_Remover_Angular
npm install
npm start            # http://localhost:4200 (uses a local backend at http://localhost:5000)
```

Run the [Flask backend](https://github.com/mr-ask-chay/PDF_Password_Remover_Flask)
locally on port 5000 to process files.

```bash
npm test                                   # unit tests (Karma + Jasmine)
npx ng build --configuration production    # production build + prerendered pages
```

## How it works

1. Choose a password-protected PDF.
2. Enter its current password.
3. Select **Remove Password** — the file is sent over HTTPS to the backend,
   which opens it with your password and returns an unprotected copy.
4. Download the unlocked PDF.

## Legal

[Privacy Policy](https://pdf-fe-kappa.vercel.app/privacy) ·
[Terms of Use](https://pdf-fe-kappa.vercel.app/terms)

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md). Report security issues as described in
[SECURITY.md](SECURITY.md).

## Contact

Built by **Sai Krishna Chaitanya** —
[GitHub](https://github.com/mr-ask-chay) ·
[Linktree](https://linktr.ee/mr_ask_chay)

## License

[MIT](LICENSE)
