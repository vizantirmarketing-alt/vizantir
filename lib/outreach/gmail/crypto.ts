/**
 * The refresh token at rest: AES-256-GCM with OUTREACH_TOKEN_KEY, a random
 * 12-byte IV for every write, and the 16-byte authentication tag stored
 * beside the ciphertext. Decryption fails on any change to the ciphertext,
 * IV, tag or key.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

export type EncryptedToken = { ciphertext: string; iv: string; tag: string }

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const TAG_BYTES = 16

export function encryptToken(plain: string, key: Buffer): EncryptedToken {
  if (key.length !== 32) throw new Error('Token key must be 32 bytes')
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES })
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return { ciphertext: ciphertext.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') }
}

/** The token, or null when anything was changed or the key is wrong. */
export function decryptToken(sealed: EncryptedToken, key: Buffer): string | null {
  try {
    if (key.length !== 32) return null
    const iv = Buffer.from(sealed.iv, 'base64')
    const tag = Buffer.from(sealed.tag, 'base64')
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) return null
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES })
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(Buffer.from(sealed.ciphertext, 'base64')), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
