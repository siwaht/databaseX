import { Pool } from "pg";
import { User, UserSafe } from "@/types/user";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function getAllUsers(): Promise<UserSafe[]> {
    const result = await pool.query(
        `SELECT id, email, name, role, status, permissions, created_at as "createdAt", last_login as "lastLogin" FROM users`
    );
    return result.rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        status: row.status,
        permissions: row.permissions || [],
        createdAt: row.createdAt,
        lastLogin: row.lastLogin
    }));
}

export async function createUser(data: Omit<User, "id" | "createdAt" | "lastLogin">): Promise<UserSafe> {
    const existingResult = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        [data.email]
    );
    
    if (existingResult.rows.length > 0) {
        throw new Error("User with this email already exists");
    }

    const id = randomUUID();
    const result = await pool.query(
        `INSERT INTO users (id, email, password_hash, name, role, status, permissions, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id, email, name, role, status, permissions, created_at as "createdAt", last_login as "lastLogin"`,
        [id, data.email, data.passwordHash, data.name, data.role, data.status, data.permissions]
    );

    return result.rows[0];
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
    const updates: string[] = [];
    const values: (string | string[] | Date | undefined)[] = [];
    let paramCount = 1;

    if (data.email !== undefined) {
        updates.push(`email = $${paramCount++}`);
        values.push(data.email);
    }
    if (data.passwordHash !== undefined) {
        updates.push(`password_hash = $${paramCount++}`);
        values.push(data.passwordHash);
    }
    if (data.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(data.name);
    }
    if (data.role !== undefined) {
        updates.push(`role = $${paramCount++}`);
        values.push(data.role);
    }
    if (data.status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(data.status);
    }
    if (data.permissions !== undefined) {
        updates.push(`permissions = $${paramCount++}`);
        values.push(data.permissions);
    }
    if (data.lastLogin !== undefined) {
        updates.push(`last_login = $${paramCount++}`);
        values.push(data.lastLogin);
    }

    if (updates.length > 0) {
        values.push(id);
        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
            values
        );
    }
}

export async function deleteUser(id: string): Promise<void> {
    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
}

export async function getUserById(id: string): Promise<User | null> {
    const result = await pool.query(
        `SELECT id, email, password_hash as "passwordHash", name, role, status, permissions, created_at as "createdAt", last_login as "lastLogin" FROM users WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
        `SELECT id, email, password_hash as "passwordHash", name, role, status, permissions, created_at as "createdAt", last_login as "lastLogin" FROM users WHERE email = $1`,
        [email]
    );
    return result.rows[0] || null;
}
