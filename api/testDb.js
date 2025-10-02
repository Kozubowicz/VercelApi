import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db('InstaClone');
    const collections = await db.collections();
    return res.status(200).json({
      message: 'Connected to MongoDB!',
      collections: collections.map((c) => c.collectionName),
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return res
      .status(500)
      .json({
        error: 'Cannot connect to MongoDB DataBase',
        details: err.message,
      });
  } finally {
    await client.close();
  }
}
