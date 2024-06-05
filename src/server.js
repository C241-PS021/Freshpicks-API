require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const crypto = require('crypto');
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

// Middleware untuk memverifikasi Token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token tidak disertakan' });
  }

  const tokenParts = authHeader.split(' ');
  const token = tokenParts[1];

  const secret = process.env.JWT_SECRET;

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token tidak valid' });
    }

    req.user = decoded;

    next();
  });
}

// Endpoint untuk melakukan Register
app.all('/register', async (req, res) => {
  try {
    const {username, email, password} = req.body;

    const id = crypto.randomUUID();
    const userData = {
      username: username,
      email: email,
      password: await bcrypt.hash(password, 13),
      dateOfRegistration: new Date().toISOString(),
    };

    const existingUser = await db.collection('users').where('email', '==', req.body.email).get();

    if (!existingUser.empty) {
      return res.status(409).json({
        message: 'Email sudah terdaftar!',
      });
    }

    await db.collection('users').doc(id).set(userData);
    res.status(200).json({
      status: 'Success',
      message: 'Registrasi Berhasil!',
      userId: id,
    });

  } catch (error) {
    console.error('Error saat Registrasi:', error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint untuk melakukan Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    const userQuery = await db.collection('users').where('email', '==', email).get();

    if (userQuery.empty) {
      return res.status(404).json({ message: 'Email / Password salah' });
    }

    const userDoc = userQuery.docs[0];
    const user = userDoc.data();

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(404).json({ message: 'Email / Password salah' });
    }

    const payload = {
      username: user.username,
      email: user.email,
      userID: userDoc.id,
    };
    const secret = process.env.JWT_SECRET;
    const expiresIn = 60 * 60 * 1; // 1 jam
    const token = jwt.sign(payload, secret, { expiresIn: expiresIn });

    return res.status(200).json({
      status: 'Success',
      message: 'Login Berhasil',
      data: {
        username: user.username,
        email: user.email,
      },
      token: token,
    });

  } catch (error) {
    console.error('Error saat Login:', error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint untuk mendapatkan informasi User berdasarkan userID
app.get('/user', verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID;
    const userDoc = await db.collection('users').doc(userID).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const userData = userDoc.data();

    res.status(200).json({
      status: 'Success',
      data: userData,
    });

  } catch (error){
    console.log("Error saat mendapatkan data pengguna:", error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint untuk memperbarui data User
app.put('/user', verifyToken, async (req, res) => {
  try {
    const userID = req.user.userID;
    const { username, email, password } = req.body;

    const userDoc = await db.collection('users').doc(userID).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const updatedData = {};
    if (username){
      updatedData.username = username;
    } 
    if (email){
      updatedData.email = email;
    } 
    if (password){
      updatedData.password = await bcrypt.hash(password, 13);
    } 

    await db.collection('users').doc(userID).update(updatedData);

    res.status(200).json({
      status: 'Success',
      message: 'Data pengguna berhasil diupdate',
      data: userDoc.data(),
    });

  } catch (error) {
    console.error('Error saat mengupdate data pengguna:', error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint upload scan result ke Google Cloud
app.post('/scan-result-history', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }

    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on('error', (err) => {
      res.status(500).json({ message: err.message });
    });

    blobStream.on('finish', async () => {
      const scanHistoryID = crypto.randomUUID();
      const scanHistoryData = {
        scanResult: req.body.scanResult,
        scannedImageURL: blob.publicUrl(),
        createdAt: new Date().toISOString(),
      };

      await db
        .collection('users')
        .doc(req.user.userID)
        .collection('scan-history')
        .doc(scanHistoryID)
        .set(scanHistoryData);
      res.status(200).json({
        status: 'Success',
        message: 'Upload gambar berhasil'
      });
    });

    blobStream.end(req.file.buffer);
    }catch (error) {
      console.error('Error saat menyimpan hasil scan:', error);
      res.status(500).json({ message: error.message });
    }
});

// Endpoint untuk mendapatkan history scan result 
app.get('/scan-result-history', verifyToken, async (req, res) => {
  try {
    const scanHistory = await db
      .collection('users')
      .doc(req.user.userID)
      .collection('scan-history')
      .get();

    res.status(200).json({
      status: 'Success',
      message: 'Riwayat scan berhasil ditampilkan',
      data: {
        scanHistory: scanHistory,
      },
    });
  } catch (error) {
    console.error('Error saat Upload gambar:', error);
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});
