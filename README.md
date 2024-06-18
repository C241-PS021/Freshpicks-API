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
> - password as `string`, must be atleast 8 character

**Response:**
  ```json
  {
    "error": "false",
    "message": "Registrasi Berhasil!",
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
    "error": "false",
    "message": "Login Berhasil!",
    "data": {
      "userID": "<userID>",
      "username": "<username>",
      "email": "<email>",
      "password": "<password>",
      "dateOfRegistration": "<dateOfRegistration>",
      "token": "<token>"
    }
  }
  ```

## Get Fruit List

**Description :**
Get supported fruit name, description, and image

**Method :**

> `GET`

**Path :**

> /fruits

**HEADER :**

> `Authorization` : `Bearer <token>`

**Response Data:**
  ```json
  {
    "error": "false",
    "message": "Daftar buah berhasil didapatkan",
    "fruitList": [
            {
                "Name": "<Name>",
                "Description": "<Description>"
                "fruitImageURL": "<fruitImageURL>",
            },
  }
  ```

## Get User Detail

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
    "error": "false",
    "message": "Data pengguna berhasil didapatkan",
    "data": {
      "userID": "<userID>",
      "username": "<username>",
      "email": "<email>",
      "password": "<hash password>", 
      "dateOfRegistration": "<dateOfRegistration>"
    }
  }
  ```

## Upload User Scan Result

**Description :**
Upload scan result to Google Cloud Storage and Firestore

**Method :**

> `POST`

**Path :**

> /user/scan-result-history

**HEADER :**

> `Authorization` : `Bearer <token>`

**Request Body:**
> - image as file `png`, `jpg`, `jpeg`
> - fruitName as `string`
> - scanResult as `string`

**Response Data:**
  ```json
  {
    "error": "false",
    "message": "Upload scan result berhasil",
    "userID": "<userID>",
    "data": {
      "scanID": "<scanID>",
      "fruitName": "<fruitName>",
      "scanResult": "<scanResult>",
      "scannedImageURL": "<scannedImageURL>", 
      "createdAt": "<createdAt>"
    }
  }
  ```

## Get User Scan Result History

**Description :**
Get user scan result history from Google Cloud Storage and Firestore

**Method :**

> `GET`

**Path :**

> /user/scan-result-history

**Parameter :**

> - fruitName as `string`
> - scanResult as `string`

**HEADER :**

> `Authorization` : `Bearer <token>`

**Response Data:**
  ```json
  {
    "error": "false",
    "message": "Riwayat scan berhasil didapatkan",
    "userID": "<userID>",
    "scanHistory": [
            {
                "id": "<scanID>",
                "createdAt": "<createdAt>",
                "scannedImageURL": "<scannedImageURL>",
                "fruitName": "<fruitName>",
                "scanResult": "<scanResult>"
            },
  }
  ```

## Delete User Scan Result History by ScanID

**Description :**
Delete user scan result history by scanid from Google Cloud Storage and Firestore

**Method :**

> `DELETE`

**Path :**

> /user/scan-result-history/:scanID

**HEADER :**

> `Authorization` : `Bearer <token>`

**Response Data:**
  ```json
  {
    "error": "false",
    "message": "Hasil scan berhasil dihapus",
    "userID": "<userID>",
    "scanID": "<scanID>"
  }
  ```

## Delete All User Scan Result History

**Description :**
Delete all user scan result history from Google Cloud Storage and Firestore

**Method :**

> `DELETE`

**Path :**

> /user/scan-result-history

**HEADER :**

> `Authorization` : `Bearer <token>`

**Response Data:**
  ```json
  {
    "error": "false",
    "message": "Semua riwayat hasil scan berhasil dihapus",
    "userID": "<userID>",
  }
  ```
