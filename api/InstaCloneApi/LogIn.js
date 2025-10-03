import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  await client.connect();
  cachedDb = client.db('InstaClone');
  return cachedDb;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body; // Vercel parsuje JSON automatycznie

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing fields' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('Users');

    const user = await usersCollection.findOne({
      email: { $regex: `^${email}$`, $options: 'i' },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (password !== user.password) {
      return res
        .status(401)
        .json({ success: false, message: 'Incorrect Password' });
    }

    return res.status(200).json({
      success: true,
      message: 'Successful login',
      id: user._id,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
