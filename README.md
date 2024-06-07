# Freshpicks-API
We use Node.js with Express.js framework to create our Backend API

# API Endpoint

## Register

**Description :**
Register new user

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

- Method: `POST`
- Path: `/login`
- Description: Login already existing user
- Request Data:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- Response Data:
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

  ## Login

- Method: `GET`
- Path: `/login`
- Description: Login already existing user
- Request Data:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- Response Data:
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
