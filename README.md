# Bankuish Interview Test

## Requirements

Node version `17.0.1`
PostgreSQL `14.2`

## Environment Vars

Ensure the following environment variables are set using a `.env` file in the root directory.

```
SECRET=add_secret_string_here
```

## Database Setup

```bash
CREATE DATABASE bankuish-courses;
CREATE DATABASE bankuish-courses-test;
```

Ensure to create file `./config/config.json` and insert configuration
```bash
{
  "development": {
    "username": "username",
    "password": null,
    "database": "bankuish-courses",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  "test": {
    "username": "username",
    "password": null,
    "database": "bankuish-courses-test",
    "host": "127.0.0.1",
    "dialect": "postgres",
    "logging": false
  }
}

```

## Installing Dependencies
```bash
$ npm install
```

## Running the Api
```bash
# development
$ npm run dev
```

## Test

```bash
# unit tests
$ npm run test
```

## Generating API documentation
```bash
$ npm run docs
```