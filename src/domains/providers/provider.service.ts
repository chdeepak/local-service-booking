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

  async create(provider: Omit<Provider, 'id'>): Promise<Provider> {
    return this.repo.create(provider);
  }

  async update(id: string, provider: Partial<Provider>): Promise<Provider | null> {
    return this.repo.update(id, provider);
  }

  async delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }
}
