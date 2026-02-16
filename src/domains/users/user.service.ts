import { UserRepository } from './user.repository.js';
import { User } from './user.entity.js';

export class UserService {
  constructor(private repo = new UserRepository()) {}

  async getAll(): Promise<User[]> {
    return this.repo.findAll();
  }

  async getById(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }

  async create(name: string, email: string, phone: string): Promise<User> {
    if (!name || name.trim().length === 0) {
      throw new Error('User name is required');
    }
    if (!email || email.trim().length === 0) {
      throw new Error('User email is required');
    }
    if (!phone || phone.trim().length === 0) {
      throw new Error('User phone is required');
    }
    return this.repo.create(name, email, phone);
  }

  async update(id: string, name: string, email: string, phone: string): Promise<User | null> {
    if (!name || name.trim().length === 0) {
      throw new Error('User name is required');
    }
    if (!email || email.trim().length === 0) {
      throw new Error('User email is required');
    }
    if (!phone || phone.trim().length === 0) {
      throw new Error('User phone is required');
    }
    return this.repo.update(id, name, email, phone);
  }

  async delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }
}
