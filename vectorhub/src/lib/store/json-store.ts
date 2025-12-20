import fs from 'fs/promises';
import path from 'path';

// Base data directory
const DATA_DIR = path.join(process.cwd(), 'data');

export class JsonStore<T extends { id: string }> {
    private filePath: string;
    private fileName: string;

    constructor(fileName: string) {
        this.fileName = fileName;
        this.filePath = path.join(DATA_DIR, fileName);
    }

    private async ensureDir() {
        try {
            await fs.access(DATA_DIR);
        } catch {
            await fs.mkdir(DATA_DIR, { recursive: true });
        }
    }

    private async read(): Promise<T[]> {
        await this.ensureDir();
        try {
            const data = await fs.readFile(this.filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, return empty array
            if ((error as any).code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    private async write(data: T[]): Promise<void> {
        await this.ensureDir();
        await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    }

    async getAll(): Promise<T[]> {
        return this.read();
    }

    async getById(id: string): Promise<T | undefined> {
        const items = await this.read();
        return items.find(item => item.id === id);
    }

    async create(item: T): Promise<T> {
        const items = await this.read();
        items.push(item);
        await this.write(items);
        return item;
    }

    async update(id: string, updates: Partial<T>): Promise<T | undefined> {
        const items = await this.read();
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return undefined;

        const updatedItem = { ...items[index], ...updates };
        items[index] = updatedItem;
        await this.write(items);
        return updatedItem;
    }

    async delete(id: string): Promise<boolean> {
        const items = await this.read();
        const filtered = items.filter(item => item.id !== id);
        if (filtered.length === items.length) return false;

        await this.write(filtered);
        return true;
    }

    async restore(data: T[]): Promise<void> {
        await this.write(data);
    }
}
