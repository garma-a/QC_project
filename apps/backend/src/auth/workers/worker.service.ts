import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { resolve, extname } from 'path';
import Piscina from 'piscina';
import * as os from 'os';

@Injectable()
export class WorkerService implements OnModuleDestroy {
  private piscina: Piscina;

  constructor() {
    const ext = extname(__filename); // Will be .ts when running with Bun, .js when running compiled code
    
    // Reserve at least 1 core for the main event loop to prevent CPU starvation under heavy load
    const reservedCores = Math.max(1, os.cpus().length - 1);

    this.piscina = new Piscina({
      filename: resolve(__dirname, `argon2.worker${ext}`),
      maxThreads: reservedCores,
      minThreads: 1,
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
