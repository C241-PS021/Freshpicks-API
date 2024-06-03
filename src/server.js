const bcrypt = require('bcrypt');
const express = require('express');
const app = express();
const port = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.get('/hello/:id', async (req, res) => {
  const db = admin.firestore();
  const existingUser = await db.collection('users').doc(req.params.id).get();
  res.send(existingUser.data());
});

app.all('/register', async (req, res) => {
  try {
    const db = admin.firestore();
    const id = req.body.email;
    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    };

    // Check if the email address has already been registered
    const existingUser = await db.collection('users').doc(req.body.email).get();

    if (existingUser.data()) {
      return res.status(409).json({
        message: 'Email sudah terdaftar!',
      });
    }

    // If the email address has never been registered, proceed to create new user
    const storeData = await db.collection('users').doc(id).set(userData);
    res.status(200).json({
      message: 'Registrasi Berhasil!',
    });
  } catch (error) {
    res.send(error);
  }
});

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});
