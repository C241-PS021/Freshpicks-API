require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi Firestore
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Konfigurasi Multer untuk upload file
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Konfigurasi Google Cloud Storage
const gcs = new Storage({
  keyFilename: path.join(__dirname, '../serviceAccountKey.json'),
});
const bucket = gcs.bucket(process.env.GCLOUD_STORAGE_BUCKET);

// Endpoint untuk melakukan Register
app.all('/register', async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 13);

    const id = req.body.email;
    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: hash,
    };

    const existingUser = await db.collection('users').doc(req.body.email).get();

    if (existingUser.data()) {
      return res.status(409).json({
        message: 'Email sudah terdaftar!',
      });
    }

    const storeData = await db.collection('users').doc(id).set(userData);
    res.status(200).json({
      message: 'Registrasi Berhasil!',
    });
  } catch (error) {
    console.error('Error saat Registrasi:', error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint untuk melakukan Login
app.get('/login', async (req, res) => {
  try {
    const user = await db.collection('users').doc(req.body.email).get();
    if (!user.data()) {
      return res.status(404).json({ message: 'Email / Password salah' });
    }
    const password = await bcrypt.compare(
      req.body.password,
      user.data().password
    );

    if (!password) {
      return res.status(404).json({ message: 'Email / Password salah' });
    }

    const payload = {
      username: user.data().username,
      email: user.data().email,
    };
    const secret = process.env.JWT_SECRET;
    const expiresIn = 60 * 60 * 1;
    const token = jwt.sign(payload, secret, { expiresIn: expiresIn });

    return res.status(200).json({
      message: 'Login Berhasil',
      data: {
        username: user.data().username,
        email: user.data().email,
      },
      token: token,
    });
  } catch (error) {
    console.error('Error saat Login:', error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint untuk upload gambar ke Google Cloud Storage
app.post('/upload-scanned-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on('error', (err) => {
      res.status(500).json({ message: err.message });
    });

    blobStream.on('finish', () => {
      res.status(200).json({ message: 'Upload successful'});
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error('Error saat Upload gambar:', error);
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});
