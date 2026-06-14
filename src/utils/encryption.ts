import CryptoJS from 'crypto-js'
import type { EncryptedData } from '@/types'

const ENCRYPTION_VERSION = '1.0'
const ENCRYPTION_ALGORITHM = 'AES-256-CBC'
const KEY_SIZE = 256
const ITERATIONS = 10000

const generateSalt = (): string => {
  return CryptoJS.lib.WordArray.random(128 / 8).toString()
}

const generateIV = (): string => {
  return CryptoJS.lib.WordArray.random(128 / 8).toString()
}

const deriveKey = (password: string, salt: string): CryptoJS.lib.WordArray => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: KEY_SIZE / 32,
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA256
  })
}

export const encryptData = (data: any, password: string): EncryptedData => {
  const salt = generateSalt()
  const iv = generateIV()
  const key = deriveKey(password, salt)
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data)

  const ciphertext = CryptoJS.AES.encrypt(plaintext, key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  }).toString()

  return {
    iv,
    ciphertext,
    salt,
    version: ENCRYPTION_VERSION,
    algorithm: ENCRYPTION_ALGORITHM
  }
}

export const decryptData = <T = any>(encrypted: EncryptedData, password: string): T | null => {
  try {
    const key = deriveKey(password, encrypted.salt)
    const bytes = CryptoJS.AES.decrypt(encrypted.ciphertext, key, {
      iv: CryptoJS.enc.Hex.parse(encrypted.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)

    try {
      return JSON.parse(decrypted) as T
    } catch {
      return decrypted as unknown as T
    }
  } catch {
    return null
  }
}

export const hashPassword = (password: string, salt?: string): { hash: string; salt: string } => {
  const actualSalt = salt || generateSalt()
  const hash = CryptoJS.PBKDF2(password, actualSalt, {
    keySize: 256 / 32,
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA256
  }).toString()
  return { hash, salt: actualSalt }
}

export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const result = hashPassword(password, salt)
  return result.hash === hash
}

export const generateChecksum = (data: any): string => {
  const content = typeof data === 'string' ? data : JSON.stringify(data)
  return CryptoJS.SHA256(content).toString()
}

export const verifyChecksum = (data: any, expectedChecksum: string): boolean => {
  return generateChecksum(data) === expectedChecksum
}

export const generateSecureId = (): string => {
  return CryptoJS.lib.WordArray.random(16).toString()
}

export const encryptStorageItem = (key: string, data: any, password: string): void => {
  const encrypted = encryptData(data, password)
  localStorage.setItem(key, JSON.stringify(encrypted))
}

export const decryptStorageItem = <T = any>(key: string, password: string): T | null => {
  const stored = localStorage.getItem(key)
  if (!stored) return null
  try {
    const encrypted = JSON.parse(stored) as EncryptedData
    return decryptData<T>(encrypted, password)
  } catch {
    return null
  }
}

export const isEncryptedData = (data: any): data is EncryptedData => {
  return (
    data &&
    typeof data === 'object' &&
    'iv' in data &&
    'ciphertext' in data &&
    'salt' in data &&
    'version' in data &&
    'algorithm' in data
  )
}
