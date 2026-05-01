import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './.env' });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms';
const client = new MongoClient(uri, {});

(async () => {
  try {
    await client.connect();
    const dbName = uri.split('/').pop() || 'lms';
    const db = client.db(dbName);
    const users = db.collection('users');

    const admin = await users.findOne({ email: 'admin@system.com' });
    if (!admin) {
      console.log('ADMIN_NOT_FOUND');
      process.exit(0);
    }

    console.log('ADMIN_FOUND');
    console.log('id:', admin._id.toString());
    console.log('email:', admin.email);
    console.log('name:', admin.name);
    console.log('role:', admin.role);
    console.log('isEmailVerified:', admin.isEmailVerified);
    console.log('storedPasswordHash:', admin.password ? admin.password : '<no password field>');

    const testPlain = process.env.ADMIN_PASSWORD || 'SecureAdminPassword123!';
    if (admin.password) {
      const ok = await bcrypt.compare(testPlain, admin.password);
      console.log('bcrypt.compare with ADMIN_PASSWORD from .env ->', ok);
    }

    await client.close();
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exit(2);
  }
  process.exit(0);
})();
