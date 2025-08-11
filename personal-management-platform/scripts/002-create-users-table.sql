-- Azure SQL Table: users
-- Columns: id (int, PK, identity), email (nvarchar, unique), passwordHash (nvarchar), role (nvarchar)

CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    passwordHash NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL -- 'admin', 'contractor', etc.
);
