# /users  
  
## / (GET)  
### Return  
- "hi here is /users"  
  
## /me (GET)
- Returns my information.
### Parameters
- **Cookie** 'credential' containing valid token
### Return
```
{
  _id: ObjectID of the user(string),
  name,
  email,
  avatar: Profile image access address(looks like 'QV3jOqE2')
}
```

## /changeProfile (POST)
- Upload a picture and change my profile image with the picture.
### Parameters
- **Cookie** 'credential' containing valid token
- A file in a formdata titled *'profile-picture'*
### Return
- User information with changed profile image
```
{
  _id: ObjectID of the user(string),
  name,
  email,
  avatar: Profile image access address(looks like 'QV3jOqE2')
}
```

## /:id (GET)
- Returns an user information that matches with *:id*.
### Parameters
- **Params** 'id' that describes ObjectID of an user
### Return
```
{
  _id: :id given as parameter,
  name,
  email,
  avatar: Profile image access address(looks like 'QV3jOqE2')
}
```

## /register (POST)
- Register new user and return newly created user information.
### Parameters
- **Body**
  ```
  {
    name,
    email,
    password
  }
  ```
### Return
```
{
  _id: :id given as parameter,
  name,
  email,
  avatar: Profile image access address(looks like 'QV3jOqE2')
}
```
### Errors
- 400 Bad Request
- 409 Email already registered

## /login (POST)
- Login with given email and PW
### Parameters
- **Body**
  ```
  {
    email,
    password
  }
  ```
### Return
```
{
  _id: :id given as parameter,
  name,
  email,
  avatar: Profile image access address(looks like 'QV3jOqE2')
}
```
with **Cookie** containing JWT token


## /:id/posts (GET)
Return posts written by users matching :id
### Parameters
- **Params** id: objectID of an user

## /name/:name (GET)
Return user info with matching name
###Parameters
- **Params** name: name of an user