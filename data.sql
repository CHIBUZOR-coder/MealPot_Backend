CREATE TYPE role_enum AS ENUM ('admin', 'user', 'owner');
CREATE TYPE resturant_enum AS ENUM (
    'HotSpicy',
    'CheesyDelights',
    'SeafoodSpecials',
    'HealthyFresh',
    'SavoryCrunchy'
);
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    adress TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    image TEXT DEFAULT NULL,
    role role_enum NOT NULL DEFAULT 'user',
   verified BOOLEAN DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS resturant(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slogan TEXT,
    star TEXT,
    image TEXT DEFAULT NULL,
    description TEXT NOT NULL,
    category resturant_enum DEFAULT NULL,
    ownerId INT,
    CONSTRAINT restaurant_owner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE
    SET NULL
);
CREATE TABLE IF NOT EXISTS dishes(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC,
    description TEXT,
    image TEXT DEFAULT NULL,
    resId INT,
    CONSTRAINT resturant_dish FOREIGN KEY (resId) REFERENCES resturant (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS reviews(
    id SERIAL PRIMARY KEY,
    name TEXT,
    description TEXT,
    image TEXT DEFAULT NULL,
    resId INT,
    userId INT,
    CONSTRAINT res_review FOREIGN KEY (resId) REFERENCES resturant (id) ON DELETE CASCADE,
    CONSTRAINT user_review FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
) CREATE TABLE IF NOT EXISTS category(
    id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT DEFAULT NULL,
)

 CREATE TABLE IF NOT EXISTS category_link(
    id SERIAL PRIMARY KEY,
    res_Id INT NOT NULL,
    category_Id INT NOT NULL,
    CONSTRAINT res FOREIGN KEY (res_Id) REFERENCES resturant(id) ON DELETE CASCADE,
    CONSTRAINT category FOREIGN KEY (category_Id) REFERENCES category(id) ON DELETE CASCADE
)