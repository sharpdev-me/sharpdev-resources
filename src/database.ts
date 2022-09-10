import { AggregateOptions, MongoClient, Document } from "mongodb";
import { AuthToken, User } from "./auth/auth_middleware";
import { Commodity, maxTime } from "./elite/data";

const client = new MongoClient(`mongodb://${encodeURIComponent(process.env.MONGO_USER || "")}:${encodeURIComponent(process.env.MONGO_PASS || "")}@database:${process.env.MONGO_PORT || 27017}`);

let connected = false;

export const getClient = async () => {
    if(!connected) {
        await client.connect();
        connected = true;
    }
    return client;
}

export const disconnect = async () => {
    connected = false;
    await client.close();
}

export const getDatabase = async () => {
    return (await getClient()).db("resources");
}

export const eliteCollection = async () => {
    return (await getDatabase()).collection("elite");
}

export const authTokensCollection = async () => {
    return (await getDatabase()).collection("auth_tokens");
}

export const usersCollection = async () => {
    return (await getDatabase()).collection("users");
}

export const purgeEliteData = async (before: number) => {
    const collection = await eliteCollection();

    collection.deleteMany({
        time: { "$lte": before }
    });
}

export const addEliteData = async (commodity: Commodity) => {
    const collection = await eliteCollection();

    collection.insertOne(commodity);
}

export const getEliteData = async (name: string, after?: number): Promise<Commodity[]> => {
    const collection = await eliteCollection();

    const cursor = collection.find<Commodity>({name: name, time: { "$gte": (after || Date.now() - maxTime)}});

    const r: Commodity[] = [];
    while(await cursor.hasNext()) {
        r.push(await cursor.next() as any);
    }

    return r;
}

export const dumpEliteData = async (after?: number): Promise<Commodity[]> => {
    const collection = await eliteCollection();
    
    const cursor = collection.find<Commodity>({time: { "$gte": (after || Date.now() - maxTime)}});

    const r: Commodity[] = [];
    while(await cursor.hasNext()) {
        r.push(await cursor.next() as any);
    }

    return r;
}

export const addAccessToken = async (token: AuthToken): Promise<boolean> => {
    const collection = await authTokensCollection();

    if((await getAccessToken(token.access_token)) != null) return false;
    collection.insertOne(token);
    return true;
}

export const getAccessToken = async (token: string): Promise<AuthToken | null> => {
    const collection = await authTokensCollection();

    const element = await collection.findOne<AuthToken>({access_token: token});
    if(!element) return null;
    return element;
}

export const getUserByToken = async (token: AuthToken): Promise<User | null> => {
    const collection = await usersCollection();

    const element = await collection.findOne<User>({username: token.user});
    if(!element) return null;
    return element;
}

export const getUserByName = async (username: string): Promise<User | null> => {
    const collection = await usersCollection();

    const element = await collection.findOne<User>({username: username});
    if(!element) return null;
    return element;
}

export const addUser = async (user: User): Promise<boolean> => {
    const collection = await usersCollection();

    if((await getUserByName(user.username)) != null) return false;
    const r = await collection.insertOne(user);
    return r.acknowledged;
}

export const updateUser = async (user: User): Promise<boolean> => {
    const collection = await usersCollection();

    const r = await collection.replaceOne({username: user.username}, user);
    return r.acknowledged && r.modifiedCount > 0;
}

export const purgeAccessTokens = async (user: User): Promise<boolean> => {
    const collection = await authTokensCollection();

    const r = await collection.deleteMany({user: user.username});
    return r.acknowledged && r.deletedCount > 0;
}

export const removeAccessToken = async (token: AuthToken): Promise<boolean> => {
    const collection = await usersCollection();

    const r = await collection.deleteOne(token);
    return r.acknowledged && r.deletedCount > 0;
}

export const deleteUser = async (user: User): Promise<boolean> => {
    const collection = await usersCollection();

    const r = await collection.deleteOne(user);
    return r.acknowledged && r.deletedCount > 0;
}