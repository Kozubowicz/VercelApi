import { MongoClient, ObjectId } from 'mongodb';

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
    const { cart } = req.body || {};

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty or invalid' });
    }

    const db = await connectToDatabase();
    const collection = db.collection('Products');

    const productsFromCart = await collection
      .find({
        _id: { $in: cart.map((item) => new ObjectId(item._id)) },
      })
      .toArray();

    return res.status(200).json(productsFromCart);
  } catch (err) {
    console.error('Error in getCartProducts handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
