import { ProviderRepository } from './provider.repository.js';
import { Provider } from './provider.entity.js';

export class ProviderService {
  constructor(private repo = new ProviderRepository()) {}

  async getAll(): Promise<Provider[]> {
    return this.repo.findAll();
  }

  async getById(id: string): Promise<Provider | null> {
    return this.repo.findById(id);
  }

  async create(name: string): Promise<Provider> {
    if (!name || name.trim().length === 0) {
      throw new Error('Provider name is required');
    }
    return this.repo.create(name);
  }

  async update(id: string, name: string): Promise<Provider | null> {
    if (!name || name.trim().length === 0) {
      throw new Error('Provider name is required');
    }
    return this.repo.update(id, name);
  }

  async delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }
}
