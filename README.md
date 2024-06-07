# Freshpicks-API
We use Node.js with Express.js framework to create our Backend API

# API Endpoint

## Register

**Description :**
Register new user and store the data in Firestore

**Method :**

> `POST`

**Path :**

> /register
 
**Request Body:**
> - username as `string`,
> - email as `string`, must be unique
> - password as `string`

**Response:**
  ```json
  {
    "status": "Success",
    "message": "Registrasi Berhasil!",
    "userID": "<userID>",
    "data": {
      "username": "<ussername>",
      "email": "<email>",
      "password": "<hash password>", 
      "dateOfRegistration": "<dateOfRegistration>"
    }
  }
  ```

## Login

**Description :**
Login existing user

**Method :**

> `POST`

**Path :**

> /login
 
**Request Body:**
> - email as `string`
> - password as `string`

**Response Data:**
  ```json
  {
    "status": "Success",
    "message": "Login Berhasil!",
    "userID": "<userID>",
    "data": {
      "username": <ussername>,
      "email": "<email>",
    }
    "token": "<token>"
  }
  ```

## User Detail

**Description :**
Get user detail from Firestore

**Method :**

> `GET`

**Path :**

> /user

**HEADER :**

> `Authorization` : `Bearer <token>`

**Response Data:**
  ```json
  {
    "status": "Success",
    "message": "Data pengguna berhasil didapatkan",
    "userID": "<userID>",
    "data": {
      "username": "<ussername>",
      "email": "<email>",
      "password": "<hash password>",
      "profilePictureURL": "<profilePictureURL>", 
      "dateOfRegistration": "<dateOfRegistration>"
    }
  }
  ```

## Update User Detail

**Description :**
Update user detail

**Method :**

> `PUT`

**Path :**

> /user

**HEADER :**

> `Authorization` : `Bearer <token>`

**Response Data:**
  ```json
  {
    "status": "Success",
    "message": "Data pengguna berhasil diperbaharui",
    "userID": "<userID>",
    "data": {
      "username": "<ussername>",
      "email": "<email>",
      "password": "<hash password>",
      "profilePictureURL": "<profilePictureURL>", 
      "dateOfRegistration": "<dateOfRegistration>"
    }
  }
  ```

## Upload Photo Profile

**Description :**
Upload photo profile to Google Cloud Storage 

**Method :**

> `POST`

**Path :**

> /user/profile-picture

**HEADER :**

> `Authorization` : `Bearer <token>`

**Request Body:**
> - image as file `png`, `jpg`, `jpeg`

**Response Data:**
  ```json
  {
    "status": "Success",
    "message": "Foto profil berhasil diupload",
    "userID": "<userID>",
    "profilePictureURL": "<profilePictureURL>"
  }
  ```
