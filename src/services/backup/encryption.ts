import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.BACKUP_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("BACKUP_ENCRYPTION_KEY environment variable is not set");
  }
  // キーが32バイト（256bit）になるようハッシュ化
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * データをAES-256-GCMで暗号化する
 * 出力形式: IV(16bytes) + AuthTag(16bytes) + 暗号文
 */
export function encryptData(plainText: string): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * AES-256-GCMで暗号化されたデータを復号する
 */
export function decryptData(encryptedBuffer: Buffer): string {
  const key = getEncryptionKey();
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
