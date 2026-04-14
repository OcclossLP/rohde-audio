This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Container Image (GHCR)

Every push to `main` (and tags like `v1.0.0`) publishes a container image to GitHub Container Registry:

```bash
docker pull ghcr.io/<github-user-or-org>/rohde-audio:latest
```

Replace `<github-user-or-org>` with the GitHub repository owner.

If you run the container over plain `http://` (without TLS), set:

```bash
COOKIE_SECURE=false
```

Otherwise, CSRF/session cookies are marked `Secure` and browser actions (login/forms/admin updates) will fail on HTTP.

## Subdomains

The app supports these portal subdomains out of the box:

- `admin.rohde-audio.de` → `/admin`
- `account.rohde-audio.de` → `/account`
- local development: `admin.localhost:3000` and `account.localhost:3000`

Recommended environment variables for production:

```bash
NEXT_PUBLIC_ROOT_DOMAIN=rohde-audio.de
AUTH_COOKIE_DOMAIN=.rohde-audio.de
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
