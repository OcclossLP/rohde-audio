# Rohde Audio Subdomain- und Integrations-Guide

## Ziel
Dieses Dokument ist die zentrale Referenz fuer:
- Subdomain-Integration
- Sicherheitschecks (Auth, CSRF, Cookie-Handling)
- externe Service-Links (Cloud, Tickets, Invoice)
- geplante Integrationen (Seafile, Pretix, Invoice Ninja)
- SSO-Vorbereitung

## Uebergeordnete Architektur

1. Haupt-App: `app/` (Next.js, RSC + Client Components)
2. Auth: `app/api/auth/*` und `lib/auth.ts`
3. CSRF: `app/api/csrf/route.ts` und `lib/csrf.ts`
4. Subdomain-Logik: `lib/subdomains.ts`
5. Proxy/Host-Umleitung: `proxy.ts` (Next 16, Middleware-Ersatz)
6. Admin: `app/admin/*`
7. Externe Links: `lib/externalLinks.ts`
8. Invoice-Ninja-Anbindung: `lib/invoice-ninja*.ts` und `app/api/admin/invoice-ninja/*`

## Aktueller Status (dokumentiert am 02.04.2026)

- Dev-Run funktioniert (nach Wechsel von `middleware.ts` auf `proxy.ts`)
- Build erfolgreich
- Lint: 0 Errors, 1 bekannte Warning (Admin-Dashboard-Image)
- Subdomains: `admin` und `account` intern, `cloud`/`invoice`/`tickets` als externe Links
- Cookie-Sicherheit: `HttpOnly`, `Secure`, `SameSite=strict` (Auth-Token und CSRF)

## 1) Subdomain-Logik pruefen und absichern

### 1.1 Datei: `lib/subdomains.ts`
- Hostname aus Request-Header auswerten
- Standard-Redirect fuer `localhost`:
  - `/admin` und `/account`
  - optional `NEXT_PUBLIC_ENABLE_LOCAL_SUBDOMAINS` fuer `admin.localhost` etc.
- `AUTH_COOKIE_DOMAIN` optional, nur bei gewolltem Domain-uebergreifendem Cookie-Branding
- `ROOT_DOMAIN` mit/ohne `www` sauber behandeln

### 1.2 Proxy: `proxy.ts`
- Host-Header-Mapping:
  - `admin.*` -> `/admin`
  - `account.*` -> `/account`
  - sonst normaler Flow
- sichere Weiterleitungen
- keine offenen Host-Redirects

### 1.3 CSRF Hardening
- `app/api/csrf/route.ts`: `SameSite=strict`, `Domain` optional
- `lib/csrf.ts`: `checkOrigin` und `checkReferer` fuer mutierende Requests
- `lib/csrf.ts`: CSRF-Header fuer non-safe Methoden verpflichtend
- bei Host-Mismatch: `403` (verbindlich)

### 1.4 Auth-Flow und Rate Limit
- `lib/auth.ts`: `validateSession` und `requireAdmin`
- Rate-Limit: `lib/rateLimit.ts` (aktuell fuer sensible Pfade, Zielwert ~10/Minute)
- Passwort-Hashing: `PBKDF2` mit Salt, minimale Passwortlaenge 8 Zeichen

### 1.5 Security-Patches (02.04.2026)
- `lib/auth.ts`: keine Passwort-Hashes/-Salts mehr im User-Objekt von `getCurrentUser`
- `lib/csrf.ts`: `requireCsrf` verlangt bei `POST/PUT/PATCH/DELETE` explizit Header plus Cookie und prueft Origin/Referer
- `lib/email.ts`: doppeltes `escapeHtml` entfernt, Escaping-Variablen validiert

## 2) Header und Footer: externe Links

### 2.1 `app/components/Navbar.tsx`
- Ticketshop:
  - `https://tickets.rohde-audio.com/rohde-audio/`
- optional Cloud und Invoice als Icon-Link

### 2.2 `app/components/Footer.tsx`
- Cloud-CTA:
  - Text: `Hier geht's in die Cloud ->`
  - Link: `https://cloud.rohde-audio.com`
- Ticketshop-Link
- optional Hinweis auf Invoice-Dashboard: `https://invoice.rohde-audio.com`

### 2.3 Admin Dashboard
- Link/Button `Buchhaltung`
- URL: `https://invoice.rohde-audio.com`

## 3) Neue Features (Roadmap)

### 3.1 Seafile-Integration (Cloud)
- Cloud-Zugang anfragen (Request-Workflow)
- Admin-Status und Freigabeprozess
- optional: Kundenordner automatisch beim Paket-Anlegen erzeugen
- Seafile-API: `https://cloud.rohde-audio.com/api2`

### 3.2 Pretix-Integration (Tickets)
- Account-Setup bei Registrierung
- Verbindung per 1-Click nach Login
- optional Webhook fuer Ticketkaeufe (z. B. `webhook/pretix`) inkl. Sync
- Ticketstatus im User-Dashboard

### 3.3 Invoice Ninja (Buchhaltung)
- Kunden in Invoice Ninja anlegen/abgleichen
- Rechnungsdaten ins Admin-Dashboard holen
- offene Rechnungen im Kundenprofil anzeigen
- API: `https://invoice.rohde-audio.com/api/v1`

## 4) SSO-Vorbereitung (zentrale Auth-Schicht)

### 4.1 Ziel
Ein Login fuer alle Services:
- Rohde Audio (Next App)
- Seafile
- Pretix
- Invoice Ninja

### 4.2 Moegliche Technologien
- OAuth2/OIDC (z. B. Keycloak, Authentik, Ory, Auth0)
- SAML (falls einzelne Zielsysteme OIDC nicht sauber unterstuetzen)
- JWT-basiert mit gemeinsamem Issuer

### 4.3 Architekturvorschlag
1. Auth-Service (z. B. Keycloak) intern aufbauen
2. Next-App nutzt `oauth/authorize` plus `callback`-Endpoint
3. Service-Links intern ueber verifizierte Session/Token steuern
4. Seafile/Pretix/Invoice Ninja als Clients konfigurieren:
   - `redirect_uri` je Subdomain (`https://<subdomain>...`)
   - ggf. Proxy fuer interne Erreichbarkeit
5. globales Token-Refresh und Logout

### 4.4 Sicherheitsregeln
- `state` und `nonce` bei OAuth verpflichtend
- `PKCE` fuer Public Clients
- `https` in Produktion verpflichtend
- Claim-Audit: `sub`, `email`, `roles`
- Trennung: App-Session in Next; `id_token`/`access_token` nicht client-cookie-lesbar

## 5) Arbeitsanleitung: Schritt fuer Schritt

### Schritt A: Repo aufsetzen
1. `git clone ...`
2. `pnpm install`
3. `pnpm dev` (localhost) pruefen

### Schritt B: Subdomain-Einstellungen
1. `.env` pruefen: `NEXT_PUBLIC_ROOT_DOMAIN`, `AUTH_COOKIE_DOMAIN`
2. Debug in `lib/subdomains.ts`: `isLocalhost`, Root-Domain, Host-Mapping
3. `/api/csrf` im Browser aufrufen und Cookie-Setzung pruefen

### Schritt C: Links und UI
1. `app/components/Navbar.tsx` mit Ticketshop-URL aktualisieren
2. `app/components/Footer.tsx` mit Cloud- und Ticketshop-Links aktualisieren
3. `app/admin/AdminDashboard.tsx` um Buchhaltung-Link ergaenzen

### Schritt D: Security Hardening
1. `next.config.ts` Security-Header pruefen
2. `app/api/auth/signup/route.ts`: Mindestpasswortlaenge (8+)
3. `app/api/auth/login/route.ts`: Rate-Limit sicherstellen
4. `lib/csrf.ts`: Origin-Check plus `SameSite=strict`

### Schritt E: Testen
1. `pnpm lint`
2. `pnpm test` (falls vorhanden)
3. `pnpm build`
4. `pnpm dev` plus manuelle Flows durchtesten

### Schritt F: Produktions-Deployment
1. Docker-Setup mit Traefik oder nginx
2. DNS:
   - `admin.rohde-audio.com`
   - `account.rohde-audio.com`
   - `cloud.rohde-audio.com`
   - `invoice.rohde-audio.com`
   - `tickets.rohde-audio.com`
3. TLS: Let's Encrypt oder vergleichbar
4. Environment:
   - `AUTH_COOKIE_DOMAIN=.rohde-audio.com` (falls gewuenscht)
   - `NEXT_PUBLIC_ROOT_DOMAIN=rohde-audio.com`

### Schritt G: SSO spaeter
1. zentralen Auth-Server aufsetzen
2. Service-Clients konfigurieren
3. Backends anpassen (OAuth-Client/Token-Validierung)
4. Session-Management vereinheitlichen

## 6) Troubleshooting

- `pnpm dev` Exit 1: Port 3000 ist belegt, alten Next-Dev-Prozess beenden
- `csrf token mismatch`: Seite neu laden und ggf. Cookies leeren
- `403 /api/admin`: `requireAdmin` Rollenpruefung und Session kontrollieren
- `subdomain not found`: lokale DNS-/`/etc/hosts`-Eintraege pruefen

## 7) Ideen-Backlog (zur spaeteren Diskussion)

- Integrations-Health-Check im Admin:
  - Ampelstatus fuer Pretix/Seafile/Invoice API
  - letzter erfolgreicher Sync + Fehlermeldungen
- Einheitlicher Webhook-Standard:
  - Signaturpruefung
  - Idempotency-Key
  - Retry-Strategie
- Hintergrundjobs fuer Sync:
  - Queue statt direkter API-Kopplung im Request
  - Dead-Letter/Fehlerablage
- Audit-Log fuer Integrationen:
  - wer hat was ausgeloest
  - API-Antworten (gekürzt) zur Nachvollziehbarkeit
- Feature-Flags je Integration:
  - stufenweises Rollout (Dev -> Staging -> Prod)
  - schnelles Deaktivieren bei Stoerungen

---

## Datei-Historie

- 2026-04-02: Subdomain-Flow und externe Links implementiert
- 2026-04-02: Security-Check und SSO-Potenzial dokumentiert
- 2026-04-04: Redaktionelle Ueberarbeitung, Tippfehlerkorrektur, Konsistenz verbessert, Ideen-Backlog ergaenzt
