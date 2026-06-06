import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { resolve, extname } from 'path';
import Piscina from 'piscina';

@Injectable()
export class WorkerService implements OnModuleDestroy {
  private piscina: Piscina;

  constructor() {
    const ext = extname(__filename); // Will be .ts when running with Bun, .js when running compiled code
    this.piscina = new Piscina({
      filename: resolve(__dirname, `argon2.worker${ext}`),
    });
  }

  async onModuleDestroy() {
    await this.piscina.destroy();
  }

  verifyPassword(hash: string, password: string): Promise<boolean> {
    return this.piscina.run({ hash, password }, { name: 'verifyPassword' });
  }

  hashPassword(password: string): Promise<string> {
    return this.piscina.run({ password }, { name: 'hashPassword' });
  }
}
