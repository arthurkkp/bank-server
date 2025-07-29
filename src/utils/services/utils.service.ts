import * as bcrypt from 'bcrypt';
import * as _ from 'lodash';
import * as crypto from 'crypto';

export class UtilsService {
  public static toDto<T, E>(
    model: new (entity: E, options?: any) => T,
    entity: E,
    options?: any,
  ): T;
  public static toDto<T, E>(
    model: new (entity: E, options?: any) => T,
    entity: E[],
    options?: any,
  ): T[];
  public static toDto<T, E>(
    model: new (entity: E, options?: any) => T,
    entity: E | E[],
    options?: any,
  ): T | T[] {
    if (_.isArray(entity)) {
      return entity.map((u) => new model(u, options));
    }

    return new model(entity, options);
  }

  static generateHash(password: string): string {
    return bcrypt.hashSync(password, 12);
  }

  static async generateHashAsync(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePinCodeStrength(pinCode: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const pinStr = pinCode.toString();
    
    if (pinStr.length !== 6) {
      errors.push('PIN code must be exactly 6 digits');
    }
    
    if (/^(\d)\1{5}$/.test(pinStr)) {
      errors.push('PIN code cannot be all the same digit');
    }
    
    if (/^(012345|123456|234567|345678|456789|567890|654321|543210|432109|321098|210987|109876)$/.test(pinStr)) {
      errors.push('PIN code cannot be a sequential pattern');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateHash(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash || '');
  }

  static generateRandomInteger(min: number, max: number): number {
    return Math.floor(min + Math.random() * (max + 1 - min));
  }

  static generateRandomString(length: number): string {
    return Math.random()
      .toString(36)
      .replace(/[^a-zA-Z0-9]+/g, '')
      .toUpperCase()
      .substr(0, length);
  }

  static getAge(d1: Date, d2?: Date): number {
    d2 = d2 || new Date();
    const diff = d2.getTime() - d1.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  static capitalizeName(name: string): string {
    return _.capitalize(name);
  }

  /**
   * encode (hash) text to sha256
   * @param {string} text
   * @returns {string}
   */
  static encodeString(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
