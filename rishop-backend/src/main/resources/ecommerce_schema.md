# 📦 E-Commerce Platform Database Schema (PostgreSQL)

This schema is designed for a student-based e-commerce platform, where users (students) can **upload**, **sell**, and **buy** products. The schema supports user authentication, product listing, cart management, and order tracking.

---

## 🔐 users Table

Stores student login credentials and profile.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📦 product Table

Each product uploaded by a student.

```sql
CREATE TABLE product (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    brand VARCHAR(255),
    category VARCHAR(255),
    price NUMERIC(10, 2) NOT NULL,
    release_date DATE,
    product_available BOOLEAN DEFAULT TRUE,
    stock_quantity INT NOT NULL,
    image_url VARCHAR(255),
    public_id VARCHAR(255),
    uploaded_by INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🛒 carts Table

Each user has one cart.

```sql
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧺 cart_items Table

Stores items in each user's cart.

```sql
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT REFERENCES carts(id) ON DELETE CASCADE,
    product_id INT REFERENCES product(id),
    quantity INT NOT NULL CHECK (quantity > 0)
);
```

---

## 📄 orders Table

Stores user order records.

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(10, 2) NOT NULL
);
```

---

## 📑 order_items Table

Each item within an order.

```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES product(id),
    quantity INT NOT NULL,
    price_at_purchase NUMERIC(10, 2) NOT NULL
);
```

---

## 🔗 Relationships Overview

| Table        | Links to         | Description                              |
|--------------|------------------|------------------------------------------|
| `product`   | `users(id)`      | Identifies the user who uploaded it      |
| `carts`      | `users(id)`      | One cart per user                        |
| `cart_items` | `carts(id)`      | Items in a user's cart                   |
| `orders`     | `users(id)`      | Tracks user purchase history             |
| `order_items`| `orders(id)`     | Breaks down each order's product details |

---

## ✅ Features Covered

- User authentication and profile
- Product listing and uploading by users
- Shopping cart per user
- Order placement and tracking
- History of purchases

---

## 💡 Next Steps

- Seed sample data for testing
- Implement REST APIs using Spring Boot and Spring Data JPA
- Use JWT authentication to identify the currently logged-in user
