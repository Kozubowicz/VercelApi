import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  await client.connect();
  cachedDb = client.db('HealthyShop');
  return cachedDb;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const count = 12;
    const db = await connectToDatabase();
    const collection = db.collection('Products');

    const products = await collection
      .aggregate([{ $sample: { size: count } }])
      .toArray();

    return res.status(200).json(products);
  } catch (err) {
    console.error('Error in getRandomProducts handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
