require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcryptjs');
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
app.post('/register', async (req, res) => {
  try {
    const {username, email, password} = req.body;

    if (!username ||!email || !password) {
      return res.status(400).json({ message: 'Username, Email, dan Password wajib diisi' });
    }

    if (!/\S+@\S+/.test(email)) {
      return res.status(400).json({ message: 'Email tidak valid' });
    }

    // Validasi panjang password
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password harus terdiri dari minimal 8 karakter' });
    }

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
      userID: id,
      data: userData
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
    const token = jwt.sign(payload, secret);

    return res.status(200).json({
      status: 'Success',
      message: 'Login Berhasil',
      userID: userDoc.id,
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

// Endpoint untuk mendapatkan daftar buah
app.get('/fruits', verifyToken, async (req, res) => {
  try {
    let fruitsSnapshot = await db.collection('fruit').get();

    const fruits = fruitsSnapshot.docs.map(doc => ({
      ...doc.data(),
    }));

    res.status(200).json({
      status: 'Success',
      message: 'Daftar buah berhasil didapatkan',
      fruitList: fruits,
    });
  } catch (error) {
    console.error('Error saat mendapatkan Daftar buah:', error);
    res.status(500).json({ message: error.message });
  }
});


// Endpoint untuk mendapatkan informasi Pengguna berdasarkan userID
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
      message: "Data pengguna berhasil didapatkan",
      userID: userID,
      data: userData,
    });

  } catch (error){
    console.log("Error saat mendapatkan data pengguna:", error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint upload hasil scan ke Google Cloud
app.post('/user/scan-result-history', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada Gambar yang diupload' });
    }

    if(!req.body.fruitName || !req.body.scanResult){
      return res.status(400).json({ message: 'Request body tidak lengkap' });
    }

    const blob = bucket.file(`scanned-images/${req.user.userID}/${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on('error', (err) => {
      res.status(500).json({ message: err.message });
    });

    blobStream.on('finish', async () => {
      const scanHistoryID = crypto.randomUUID();
      const scanHistoryData = {
        fruitName: req.body.fruitName,
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
        message: 'Upload scan result berhasil',
        userID: req.user.userID,
        scanID: scanHistoryID,
        data: scanHistoryData,
      });
    });

    blobStream.end(req.file.buffer);
    }catch (error) {
      console.error('Error saat menyimpan hasil scan:', error);
      res.status(500).json({ message: error.message });
    }
});

// Endpoint untuk mendapatkan riwayat hasil scan Pengguna 
app.get('/user/scan-result-history', verifyToken, async (req, res) => {
  try {
    const { fruitName, scanResult } = req.query;

    let query = db.collection('users')
      .doc(req.user.userID)
      .collection('scan-history');

    if (fruitName) {
      query = query.where('fruitName', '==', fruitName);
    }

    if (scanResult) {
      query = query.where('scanResult', '==', scanResult);
    }

    const scanHistorySnapshot = await query.get();

    const scanHistory = scanHistorySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (scanHistory.length === 0) {
      return res.status(404).json({ message: 'Tidak ada hasil scan yang ditemukan dengan kriteria yang diberikan' });
    }

    res.status(200).json({
      status: 'Success',
      message: 'Riwayat scan berhasil ditampilkan',
      userID: req.user.userID,
      data: {
        scanHistory: scanHistory,
      },
    });
  } catch (error) {
    console.error('Error saat mendapatkan riwayat scan:', error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint untuk menghapus riwayat hasil scan berdasarkan ID
app.delete('/user/scan-result-history/:scanID', verifyToken, async (req, res) => {
  try {
    const scanID = req.params.scanID.replace(/:/g, '');;
    console.log(scanID)
    const userDoc = await db.collection('users').doc(req.user.userID).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const scanDoc = await db
      .collection('users')
      .doc(req.user.userID)
      .collection('scan-history')
      .doc(scanID)
      .get();

    if (!scanDoc.exists) {
      return res.status(404).json({ message: 'Hasil scan tidak ditemukan' });
    }

    const scanData = scanDoc.data();
    const scannedImageURL = decodeURIComponent(scanData.scannedImageURL);

    console.log(scannedImageURL)

    if (scannedImageURL) {
      const fileName = scannedImageURL.split(`${bucket.name}/`)[1];
      if (fileName) {
        const blob = bucket.file(fileName);
        await blob.delete();
      }
    }

    await db
      .collection('users')
      .doc(req.user.userID)
      .collection('scan-history')
      .doc(scanID)
      .delete();

    res.status(200).json({
      status: 'Success',
      message: 'Hasil scan berhasil dihapus',
      userID: req.user.userID,
      scanID: scanID
    });
  } catch (error) {
    console.error('Error saat menghapus hasil scan:', error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint untuk menghapus semua riwayat hasil scan
app.delete('/user/scan-result-history', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.userID).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const scanHistorySnapshot = await db
      .collection('users')
      .doc(req.user.userID)
      .collection('scan-history')
      .get();

    const batch = db.batch();
    const deletePromises = [];

    scanHistorySnapshot.forEach((doc) => {
      const scanData = doc.data();
      const scannedImageURL = decodeURIComponent(scanData.scannedImageURL);
      
      if (scannedImageURL) {
        const fileName = scannedImageURL.split(`${bucket.name}/`)[1];
        if (fileName) {
          const blob = bucket.file(fileName);
          deletePromises.push(blob.delete().catch((err) => {
            console.error('Error saat menghapus gambar hasil scan:', err.message);
          }));
        }
      }
      batch.delete(doc.ref);
    });

    await Promise.all(deletePromises);
    await batch.commit();

    res.status(200).json({
      status: 'Success',
      message: 'Semua riwayat hasil scan berhasil dihapus',
      userID: req.user.userID
    });
  } catch (error) {
    console.error('Error saat menghapus semua hasil scan:', error);
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});