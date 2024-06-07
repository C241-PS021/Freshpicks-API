# Freshpicks-API

## Register

- Method: `POST`
- Path: `/register`
- Description:  Register new user
- Request Data:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- Response Data:
  ```json
  {
    "status": "Success",
    "message": "Registrasi Berhasil!",
    "userID": <userID>,
    "data": {
      "username": <ussername>,
      "email": <email>,
      password: <hash password>, 
      dateOfRegistration: <dateOfRegistration>,
    }
  }
  ```
