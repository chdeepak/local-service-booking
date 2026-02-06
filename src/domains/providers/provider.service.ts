import { ProviderRepository } from './provider.repository.js';
import { Provider } from './provider.entity.js';

export class ProviderService {
  constructor(private repo = new ProviderRepository()) {}

  async getAll(): Promise<Provider[]> {
    return this.repo.findAll();
  }
}
