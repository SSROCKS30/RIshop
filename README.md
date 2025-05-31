# RIshop - E-Commerce Platform

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://openjdk.java.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue.svg)](https://www.postgresql.org/)

RIshop is a modern, full-stack e-commerce platform built with Spring Boot backend and React frontend. It provides a comprehensive solution for online shopping with features like product management, shopping cart, user authentication, and order processing.

## 🚀 Features

### Core E-Commerce Features
- **User Authentication & Authorization** - JWT-based secure authentication
- **Product Management** - Browse products by categories (Electronics, Audio, Wearables)
- **Shopping Cart** - Add/remove items, quantity management
- **Order Processing** - Complete order lifecycle management
- **User Profiles** - Personal account management
- **Image Management** - Cloudinary integration for product images

### Additional Features
- **Responsive Design** - Mobile-friendly interface
- **Real-time Chat System** - Customer support functionality
- **Search & Filter** - Advanced product search capabilities
- **Modern UI/UX** - Bootstrap and Framer Motion animations

## 🛠️ Tech Stack

### Backend (rishop-backend)
- **Framework**: Spring Boot 3.4.5
- **Language**: Java 17
- **Database**: PostgreSQL
- **Security**: Spring Security + JWT
- **ORM**: Spring Data JPA
- **Image Storage**: Cloudinary
- **Build Tool**: Maven

### Frontend (rishop-frontend)
- **Framework**: React 18.2.0
- **Build Tool**: Vite
- **Styling**: Bootstrap 5, Sass
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Icons**: React Icons
- **Routing**: React Router DOM

## 📁 Project Structure

```
RIshop/
├── rishop-backend/           # Spring Boot REST API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/ssrocks/rishop_backend/
│   │   │   │       ├── controller/
│   │   │   │       ├── model/
│   │   │   │       ├── repository/
│   │   │   │       ├── service/
│   │   │   │       └── config/
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   └── README.md
│
├── rishop-frontend/          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── assets/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── API_DOCUMENTATION.md      # API Documentation
├── TESTING_GUIDE.md         # Testing Guidelines
├── CHAT_SYSTEM_WORKFLOW.md  # Chat System Documentation
└── README.md                # This file
```

## 🚦 Getting Started

### Prerequisites
- **Java 17** or higher
- **Node.js 16** or higher
- **PostgreSQL 12** or higher
- **Maven 3.6** or higher

### Backend Setup (rishop-backend)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RIshop/rishop-backend
   ```

2. **Configure Database**
   - Create a PostgreSQL database named `rishop`
   - Update `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/rishop
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Configure Cloudinary** (for image uploads)
   - Add your Cloudinary credentials to `application.properties`:
   ```properties
   cloudinary.cloud_name=your_cloud_name
   cloudinary.api_key=your_api_key
   cloudinary.api_secret=your_api_secret
   ```

4. **Install Dependencies & Run**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

   The backend will start on `http://localhost:8080`

5. **Load Sample Data** (Optional)
   ```bash
   curl http://localhost:8080/load/dummy
   ```

### Frontend Setup (rishop-frontend)

1. **Navigate to frontend directory**
   ```bash
   cd ../rishop-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure API Base URL**
   - Update the API base URL in your service files if needed
   - Default: `http://localhost:8080`

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173`

## 🔧 Available Scripts

### Backend
```bash
mvn spring-boot:run      # Start the application
mvn test                 # Run tests
mvn clean package        # Build JAR file
```

### Frontend
```bash
npm run dev             # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
```

## 📚 API Documentation

The API documentation is available in `API_DOCUMENTATION.md`. Key endpoints include:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Products
- `GET /products` - Get all products
- `GET /products/{id}` - Get product by ID
- `POST /products` - Create new product (authenticated)

### Cart
- `GET /cart` - Get user's cart
- `POST /cart/add` - Add item to cart
- `DELETE /cart/remove/{id}` - Remove item from cart

### Orders
- `POST /orders` - Create new order
- `GET /orders` - Get user's orders

## 🧪 Testing

Comprehensive testing documentation is available in `TESTING_GUIDE.md`. The project includes:

- **Unit Tests** - Backend service and repository tests
- **Integration Tests** - API endpoint tests
- **Postman Collection** - API testing collection included

Run tests:
```bash
# Backend tests
cd rishop-backend
mvn test

# Frontend tests (if configured)
cd rishop-frontend
npm test
```

## 💬 Chat System

The project includes a real-time chat system for customer support. Documentation is available in `CHAT_SYSTEM_WORKFLOW.md`.

## 🌟 Sample Products

The application comes with sample product data including:
- **iPhone 15 Pro** - ₹125,000
- **LG Ultragear Monitor** - ₹25,600
- **OnePlus 13** - ₹64,000
- **Samsung S21 FE** - ₹29,999
- **Sony WH-1000XM5** - ₹24,000
- **Samsung Watch Ultra** - ₹41,500

## 🔐 Security Features

- **JWT Authentication** - Stateless authentication
- **Password Encryption** - BCrypt password hashing
- **CORS Configuration** - Cross-origin resource sharing
- **Input Validation** - Request validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **SSRocks Team** - *Initial work*

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- React team for the frontend library
- All open-source contributors

---

For more detailed information, please refer to the individual documentation files:
- [API Documentation](API_DOCUMENTATION.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Chat System Workflow](CHAT_SYSTEM_WORKFLOW.md) 