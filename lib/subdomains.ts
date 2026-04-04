const SUBDOMAIN_ROUTES = {
  admin: {
    basePath: "/admin",
    mode: "prefix",
  },
  account: {
    basePath: "/account",
    mode: "root-only",
  },
} as const;

type KnownSubdomain = keyof typeof SUBDOMAIN_ROUTES;

function normalizeHost(value: string | null | undefined) {
  return (value ?? "").split(":")[0].trim().toLowerCase();
}

export function getSubdomainFromHost(host: string | null | undefined) {
  const normalized = normalizeHost(host);

  if (!normalized || normalized === "localhost" || normalized === "127.0.0.1") {
    return null;
  }

  if (normalized.endsWith(".localhost")) {
    const candidate = normalized.slice(0, -".localhost".length);
    return candidate || null;
  }

  const configuredRoot = normalizeHost(
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? process.env.ROOT_DOMAIN ?? ""
  ).replace(/^\./, "");

  if (!configuredRoot || normalized === configuredRoot) {
    return null;
  }

  if (normalized.endsWith(`.${configuredRoot}`)) {
    const candidate = normalized.slice(0, -(`.${configuredRoot}`.length));
    return candidate || null;
  }

  return null;
}

export function getSubdomainRewriteTarget(
  host: string | null | undefined,
  pathname: string
) {
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return null;
  }

  const subdomain = getSubdomainFromHost(host);
  if (!subdomain) return null;

  const routeConfig =
    SUBDOMAIN_ROUTES[subdomain as keyof typeof SUBDOMAIN_ROUTES];
  if (!routeConfig) return null;

  if (routeConfig.mode === "root-only") {
    return pathname === "/" ? routeConfig.basePath : null;
  }

  if (
    pathname === routeConfig.basePath ||
    pathname.startsWith(`${routeConfig.basePath}/`)
  ) {
    return null;
  }

  return pathname === "/"
    ? routeConfig.basePath
    : `${routeConfig.basePath}${pathname}`;
}

export function getSharedCookieDomain() {
  const configuredDomain =
    process.env.AUTH_COOKIE_DOMAIN ?? process.env.COOKIE_DOMAIN;

  const normalized = normalizeHost(configuredDomain);
  if (!normalized || normalized === "localhost" || normalized === "127.0.0.1") {
    return undefined;
  }

  return normalized.startsWith(".") ? normalized : `.${normalized}`;
}

function getFallbackPath(subdomain: KnownSubdomain, pathname: string) {
  const routeConfig = SUBDOMAIN_ROUTES[subdomain];

  if (routeConfig.mode === "root-only") {
    return pathname === "/" ? routeConfig.basePath : pathname;
  }

  return pathname === "/"
    ? routeConfig.basePath
    : `${routeConfig.basePath}${pathname}`;
}

function shouldUseLocalSubdomainRouting() {
  const configuredValue = (
    process.env.NEXT_PUBLIC_ENABLE_LOCAL_SUBDOMAINS ??
    process.env.NEXT_PUBLIC_USE_LOCAL_SUBDOMAINS ??
    ""
  )
    .trim()
    .toLowerCase();

  return configuredValue === "1" || configuredValue === "true" || configuredValue === "yes";
}

export function getPortalHref(subdomain: KnownSubdomain, pathname = "/") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const fallbackPath = getFallbackPath(subdomain, normalizedPath);

  if (typeof window === "undefined") {
    return fallbackPath;
  }

  const { protocol, hostname, port } = window.location;
  const configuredRoot = normalizeHost(
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? ""
  ).replace(/^\./, "");

  if (
    shouldUseLocalSubdomainRouting() &&
    (hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".localhost"))
  ) {
    return `${protocol}//${subdomain}.localhost${port ? `:${port}` : ""}${normalizedPath}`;
  }

  if (
    configuredRoot &&
    (hostname === configuredRoot || hostname.endsWith(`.${configuredRoot}`))
  ) {
    return `${protocol}//${subdomain}.${configuredRoot}${normalizedPath}`;
  }

  return fallbackPath;
}

export function getCookieOptions(
  overrides: Partial<{
    httpOnly: boolean;
    expires: Date;
    sameSite: "lax" | "strict" | "none";
    secure: boolean;
    sharedDomain: boolean;
  }> = {}
) {
  const { sharedDomain = false, ...cookieOverrides } = overrides;
  const domain = sharedDomain ? getSharedCookieDomain() : undefined;

  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(domain ? { domain } : {}),
    ...cookieOverrides,
  };
}
