import crypto from "crypto";

const ITERATIONS = 100_000;
const KEYLEN = 64;
const DIGEST = "sha512";

export function hashPassword(password: string, salt?: string) {
  const passwordSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto
    .pbkdf2Sync(password, passwordSalt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");
  return { passwordHash, passwordSalt };
}

export function verifyPassword(
  password: string,
  passwordHash: string,
  passwordSalt: string
) {
  const candidateHash = crypto
    .pbkdf2Sync(password, passwordSalt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(passwordHash, "hex"),
    Buffer.from(candidateHash, "hex")
  );
}
