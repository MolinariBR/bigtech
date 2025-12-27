// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.7
// Utilitários de criptografia para dados sensíveis (API Keys, tokens)
// Precedência: 1.Project → 2.Architecture → 4.Entities

import * as crypto from 'crypto';

export class EncryptionUtils {
  private static algorithm = 'aes-256-gcm';
  private static keyLength = 32; // 256 bits
  private static ivLength = 16; // 128 bits
  private static tagLength = 16; // 128 bits

  /**
   * Gera uma chave de criptografia baseada em uma senha mestre
   */
  private static getKey(): Buffer {
    const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'default-dev-key-change-in-production';
    return crypto.scryptSync(masterKey, 'salt', this.keyLength);
  }

  /**
   * Encripta um texto
   */
  static encrypt(text: string): string {
    try {
      const key = this.getKey();
      const iv = crypto.randomBytes(this.ivLength);

      const cipher = crypto.createCipher(this.algorithm, key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Para GCM, precisamos do auth tag
      const authTag = (cipher as any).getAuthTag();

      // Retornar iv + authTag + encrypted
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Erro ao encriptar:', error);
      throw new Error('Falha na encriptação');
    }
  }

  /**
   * Decripta um texto
   */
  static decrypt(encryptedText: string): string {
    try {
      const key = this.getKey();
      const parts = encryptedText.split(':');

      if (parts.length !== 3) {
        throw new Error('Formato de texto encriptado inválido');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(this.algorithm, key);
      (decipher as any).setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Erro ao decriptar:', error);
      throw new Error('Falha na decriptação');
    }
  }

  /**
   * Verifica se um texto está encriptado (formato iv:tag:encrypted)
   */
  static isEncrypted(text: string): boolean {
    return text.split(':').length === 3;
  }

  /**
   * Encripta apenas se não estiver encriptado
   */
  static encryptIfNeeded(text: string): string {
    if (this.isEncrypted(text)) {
      return text; // Já está encriptado
    }
    return this.encrypt(text);
  }

  /**
   * Decripta apenas se estiver encriptado
   */
  static decryptIfNeeded(text: string): string {
    if (this.isEncrypted(text)) {
      return this.decrypt(text);
    }
    return text; // Não está encriptado
  }
}