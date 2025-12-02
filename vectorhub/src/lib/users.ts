import { MongoClient, ObjectId } from "mongodb";
import { User, UserSafe } from "@/types/user";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(MONGODB_URI);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(MONGODB_URI);
    clientPromise = client.connect();
}

export async function getUsersCollection() {
    const client = await clientPromise;
    return client.db().collection<User>("users");
}

export async function getAllUsers(): Promise<UserSafe[]> {
    const collection = await getUsersCollection();
    const users = await collection.find({}).toArray();
    return users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
    }));
}

export async function createUser(data: Omit<User, "id" | "createdAt" | "lastLogin">): Promise<UserSafe> {
    const collection = await getUsersCollection();

    const existingUser = await collection.findOne({ email: data.email });
    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    const id = new ObjectId().toHexString();
    const newUser: User = {
        ...data,
        id,
        createdAt: new Date(),
    };

    await collection.insertOne(newUser);

    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
    const collection = await getUsersCollection();
    await collection.updateOne({ id }, { $set: data });
}

export async function deleteUser(id: string): Promise<void> {
    const collection = await getUsersCollection();
    await collection.deleteOne({ id });
}

export async function getUserById(id: string): Promise<User | null> {
    const collection = await getUsersCollection();
    return collection.findOne({ id });
}
