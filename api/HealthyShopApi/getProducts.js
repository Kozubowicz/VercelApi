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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { siteIndex = 1, itemsPerPage = 12, query = '' } = req.body || {};

    const db = await connectToDatabase();
    const collection = db.collection('Products');

    // Liczymy wszystkie produkty pasujące do frazy
    const numOfproducts = await collection.countDocuments({
      name: { $regex: query, $options: 'i' },
    });

    // Pobieramy produkty z paginacją
    const products = await collection
      .find({ name: { $regex: query, $options: 'i' } })
      .skip((siteIndex - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .toArray();

    return res.status(200).json({ numOfproducts, products });
  } catch (err) {
    console.error('Error in getProducts handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
