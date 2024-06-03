require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

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
    const hash = await bcrypt.hash(req.body.password, 13);

    const id = req.body.email;
    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: hash,
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
    // get user data based on email input
    const user = await db.collection('users').doc(req.body.email).get();
    if (!user.data()) {
      return res.status(404).json({ message: 'Email / Password salah' });
    }
    const password = await bcrypt.compare(
      req.body.password,
      user.data().password
    );

    // check if the password is correct
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
    res.send(error);
  }
});


app.listen(port, () => {
  console.log(`App listening on http://localhost:${port}`);
});
