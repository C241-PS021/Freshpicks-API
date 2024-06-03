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

const db = admin.firestore();

app.all('/register', async (req, res) => {
  try {
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

app.get('/login', async (req, res) => {
  try {
    const users = await db
      .collection('users')
      .where('email', '==', req.body.email)
      .where('password', '==', req.body.password)
      .get();

    if (users.empty) {
      res.status(404).json({ message: 'Email / Password salah' });
    }

    users.forEach((user) => {
      res.send(user.data());
    });
  } catch (error) {
    res.send(error);
  }
});

app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});
