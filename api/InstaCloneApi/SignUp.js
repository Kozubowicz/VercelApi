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
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userName, email, password } = req.body || {};

    if (!userName || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('Users');

    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    const newUser = {
      email,
      userName,
      password,
      profileImg: 'https://imgur.com/ariqbyX.png',
      description: '',
    };

    const result = await usersCollection.insertOne(newUser);

    if (result.insertedId) {
      return res
        .status(201)
        .json({ success: true, message: 'Registration successful' });
    } else {
      return res
        .status(500)
        .json({ success: false, message: 'Registration failed' });
    }
  } catch (err) {
    console.error('Error in registerUser handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
