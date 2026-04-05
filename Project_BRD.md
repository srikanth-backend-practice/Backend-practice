# Business Requirements Document (BRD)
## Project: E-Commerce REST API
**Version:** 1.0.0  
**Stack:** FastAPI · PostgreSQL · SQLAlchemy ORM · Alembic · Docker  
**Deployment:** Render.com (Free Tier)  
**Timeline:** 1 Day (8–10 Hours)  
**Author:** Senior Python Developer  
**Date:** 2026-04-05  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Design — Entities & Relationships](#4-database-design--entities--relationships)
5. [Pydantic Schema Validations](#5-pydantic-schema-validations)
6. [API Endpoints](#6-api-endpoints)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Error Handling Strategy](#8-error-handling-strategy)
9. [Environment Configuration](#9-environment-configuration)
10. [ORM Models (SQLAlchemy)](#10-orm-models-sqlalchemy)
11. [Alembic Migrations](#11-alembic-migrations)
12. [Deployment on Render.com](#12-deployment-on-rendercom)
13. [Day Timeline Breakdown](#13-day-timeline-breakdown)
14. [Testing Strategy](#14-testing-strategy)
15. [Security Checklist](#15-security-checklist)

---

## 1. Project Overview

### 1.1 Purpose
Build a production-grade RESTful E-Commerce API using FastAPI that supports full product catalog management, user authentication, cart operations, order lifecycle management, and payment tracking — suitable for a frontend client or mobile app to consume.

### 1.2 Goals
- Stateless, JWT-secured API
- Fully typed with Pydantic v2 validations
- PostgreSQL with SQLAlchemy ORM + Alembic migrations
- Role-based access control (Customer / Admin)
- Clean layered architecture (Router → Service → Repository → Model)
- Deployed and live on Render.com free tier within 1 day

### 1.3 Scope
| In Scope | Out of Scope |
|---|---|
| User auth (register/login/refresh) | Real payment gateway (Stripe/Razorpay) |
| Product catalog + categories | Product reviews/ratings |
| Cart management | Wishlists |
| Order creation & tracking | Shipping integrations |
| Admin CRUD for products | Email notifications |
| Pagination, filtering, sorting | Multi-currency support |

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Web Framework | FastAPI | 0.111+ |
| Language | Python | 3.12 |
| ORM | SQLAlchemy | 2.0+ |
| Migrations | Alembic | 1.13+ |
| Database | PostgreSQL | 16 |
| Validation | Pydantic v2 | 2.7+ |
| Auth | python-jose + passlib | latest |
| Server | Uvicorn | 0.30+ |
| Process Manager | Gunicorn | 22+ |
| Containerization | Docker + Docker Compose | latest |
| Hosting | Render.com | Free tier |
| Testing | Pytest + HTTPX | latest |
| Linting | Ruff + Black | latest |

---

## 3. Project Structure

```
ecommerce-api/
├── app/
│   ├── __init__.py
│   ├── main.py                  # App entry point, lifespan, routers
│   ├── config.py                # Settings via pydantic-settings
│   ├── database.py              # SQLAlchemy engine + session
│   ├── dependencies.py          # get_db, get_current_user, require_admin
│   │
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── base.py              # Base declarative + TimestampMixin
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   └── payment.py
│   │
│   ├── schemas/                 # Pydantic v2 schemas (request/response)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   └── common.py           # Pagination, MessageResponse
│   │
│   ├── routers/                 # FastAPI routers
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── categories.py
│   │   ├── products.py
│   │   ├── cart.py
│   │   └── orders.py
│   │
│   ├── services/                # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── product_service.py
│   │   ├── cart_service.py
│   │   └── order_service.py
│   │
│   ├── repositories/            # DB query layer
│   │   ├── __init__.py
│   │   ├── user_repo.py
│   │   ├── product_repo.py
│   │   ├── cart_repo.py
│   │   └── order_repo.py
│   │
│   └── utils/
│       ├── security.py          # JWT encode/decode, password hashing
│       ├── pagination.py        # Generic paginated response builder
│       └── exceptions.py        # Custom HTTP exceptions
│
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_products.py
│   ├── test_cart.py
│   └── test_orders.py
│
├── .env                         # Local env (git-ignored)
├── .env.example
├── alembic.ini
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── render.yaml                  # Render deployment manifest
└── README.md
```

---

## 4. Database Design — Entities & Relationships

### 4.1 Entity Relationship Overview

```
User (1) ──────────< Cart (1) ──────────< CartItem (N) >──────── Product (N)
User (1) ──────────< Order (N) ──────────< OrderItem (N) >─────── Product (N)
Order (1) ─────────< Payment (1)
Category (1) ───────< Product (N)
User (1) has role: customer | admin
```

### 4.2 Entity Definitions

#### `users`
| Column | Type | Constraints |
|---|---|---|
| id | UUID (PK) | default gen_random_uuid() |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| hashed_password | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(150) | NOT NULL |
| phone | VARCHAR(20) | nullable |
| role | ENUM('customer','admin') | default 'customer' |
| is_active | BOOLEAN | default TRUE |
| created_at | TIMESTAMP | auto |
| updated_at | TIMESTAMP | auto |

#### `categories`
| Column | Type | Constraints |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR(100) | UNIQUE, NOT NULL |
| slug | VARCHAR(100) | UNIQUE, NOT NULL |
| description | TEXT | nullable |
| parent_id | UUID (FK → categories.id) | nullable (self-ref for sub-cats) |
| is_active | BOOLEAN | default TRUE |
| created_at | TIMESTAMP | auto |
| updated_at | TIMESTAMP | auto |

#### `products`
| Column | Type | Constraints |
|---|---|---|
| id | UUID (PK) | |
| category_id | UUID (FK → categories.id) | NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(255) | UNIQUE, NOT NULL |
| description | TEXT | nullable |
| price | NUMERIC(12,2) | NOT NULL, CHECK > 0 |
| compare_price | NUMERIC(12,2) | nullable |
| stock_quantity | INTEGER | NOT NULL, CHECK >= 0 |
| sku | VARCHAR(100) | UNIQUE, NOT NULL |
| image_url | VARCHAR(500) | nullable |
| is_active | BOOLEAN | default TRUE |
| created_at | TIMESTAMP | auto |
| updated_at | TIMESTAMP | auto |

#### `carts`
| Column | Type | Constraints |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | UNIQUE (one cart per user) |
| created_at | TIMESTAMP | auto |
| updated_at | TIMESTAMP | auto |

#### `cart_items`
| Column | Type | Constraints |
|---|---|---|
| id | UUID (PK) | |
| cart_id | UUID (FK → carts.id) | NOT NULL |
| product_id | UUID (FK → products.id) | NOT NULL |
| quantity | INTEGER | NOT NULL, CHECK >= 1 |
| UNIQUE | (cart_id, product_id) | composite |

#### `orders`
| Column | Type | Constraints |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | NOT NULL |
| status | ENUM | NOT NULL (see below) |
| total_amount | NUMERIC(12,2) | NOT NULL |
| shipping_address | JSONB | NOT NULL |
| notes | TEXT | nullable |
| created_at | TIMESTAMP | auto |
| updated_at | TIMESTAMP | auto |

Order Status ENUM: `pending` → `confirmed` → `processing` → `shipped` → `delivered` → `cancelled` → `refunded`

#### `order_items`
| Column | Type | Constraints |
|---|---|---|
| id | UUID (PK) | |
| order_id | UUID (FK → orders.id) | NOT NULL |
| product_id | UUID (FK → products.id) | NOT NULL |
| quantity | INTEGER | NOT NULL |
| unit_price | NUMERIC(12,2) | NOT NULL (snapshot at order time) |
| subtotal | NUMERIC(12,2) | NOT NULL |

#### `payments`
| Column | Type | Constraints |
|---|---|---|
| id | UUID (PK) | |
| order_id | UUID (FK → orders.id) | UNIQUE |
| method | ENUM('cod','upi','card','netbanking') | NOT NULL |
| status | ENUM('pending','paid','failed','refunded') | default 'pending' |
| transaction_id | VARCHAR(255) | nullable |
| paid_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | auto |

---

## 5. Pydantic Schema Validations

### 5.1 Auth Schemas

```python
# schemas/auth.py
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)
    full_name: str = Field(min_length=2, max_length=150, strip_whitespace=True)
    phone: str | None = Field(default=None, pattern=r"^\+?[1-9]\d{9,14}$")

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*]", v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("full_name")
    @classmethod
    def no_numbers_in_name(cls, v: str) -> str:
        if any(c.isdigit() for c in v):
            raise ValueError("Full name must not contain numbers")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds

class RefreshRequest(BaseModel):
    refresh_token: str
```

### 5.2 Product Schemas

```python
# schemas/product.py
from pydantic import BaseModel, Field, field_validator, model_validator
from uuid import UUID
from decimal import Decimal

class ProductCreate(BaseModel):
    category_id: UUID
    name: str = Field(min_length=3, max_length=255, strip_whitespace=True)
    description: str | None = Field(default=None, max_length=5000)
    price: Decimal = Field(gt=0, decimal_places=2)
    compare_price: Decimal | None = Field(default=None, decimal_places=2)
    stock_quantity: int = Field(ge=0)
    sku: str = Field(min_length=3, max_length=100, strip_whitespace=True)
    image_url: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def compare_price_gt_price(self) -> "ProductCreate":
        if self.compare_price is not None and self.compare_price <= self.price:
            raise ValueError("compare_price must be greater than price")
        return self

class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    compare_price: Decimal | None = None
    stock_quantity: int | None = Field(default=None, ge=0)
    image_url: str | None = None
    is_active: bool | None = None

class ProductResponse(BaseModel):
    id: UUID
    category_id: UUID
    name: str
    slug: str
    description: str | None
    price: Decimal
    compare_price: Decimal | None
    stock_quantity: int
    sku: str
    image_url: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

### 5.3 Cart Schemas

```python
# schemas/cart.py
class AddToCartRequest(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1, le=100)

class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(ge=1, le=100)

class CartItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    product_image: str | None
    unit_price: Decimal
    quantity: int
    subtotal: Decimal

class CartResponse(BaseModel):
    id: UUID
    items: list[CartItemResponse]
    total_items: int
    total_amount: Decimal
```

### 5.4 Order Schemas

```python
# schemas/order.py
class ShippingAddress(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    phone: str = Field(pattern=r"^\+?[1-9]\d{9,14}$")
    address_line1: str = Field(min_length=5, max_length=255)
    address_line2: str | None = None
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    pincode: str = Field(pattern=r"^\d{6}$")
    country: str = Field(default="India", max_length=100)

class CreateOrderRequest(BaseModel):
    shipping_address: ShippingAddress
    payment_method: Literal["cod", "upi", "card", "netbanking"]
    notes: str | None = Field(default=None, max_length=500)

class UpdateOrderStatusRequest(BaseModel):
    status: Literal["confirmed","processing","shipped","delivered","cancelled","refunded"]

class OrderResponse(BaseModel):
    id: UUID
    status: str
    total_amount: Decimal
    shipping_address: dict
    items: list[OrderItemResponse]
    payment: PaymentResponse | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

### 5.5 Common Schemas

```python
# schemas/common.py
from pydantic import BaseModel
from typing import Generic, TypeVar

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

class MessageResponse(BaseModel):
    message: str

class ProductFilters(BaseModel):
    category_id: UUID | None = None
    min_price: Decimal | None = Field(default=None, ge=0)
    max_price: Decimal | None = Field(default=None, ge=0)
    in_stock: bool | None = None
    search: str | None = Field(default=None, max_length=100)
    sort_by: Literal["price_asc","price_desc","newest","name"] = "newest"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
```

---

## 6. API Endpoints

### Base URL: `https://your-api.onrender.com/api/v1`

### 6.1 Auth Routes — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new customer account |
| POST | `/login` | Public | Login, returns JWT tokens |
| POST | `/refresh` | Public | Refresh access token |
| POST | `/logout` | Bearer | Blacklist refresh token |
| GET | `/me` | Bearer | Get current user profile |
| PATCH | `/me` | Bearer | Update own profile |
| POST | `/me/change-password` | Bearer | Change password |

### 6.2 Category Routes — `/api/v1/categories`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List all active categories |
| GET | `/{category_id}` | Public | Get single category |
| POST | `/` | Admin | Create category |
| PATCH | `/{category_id}` | Admin | Update category |
| DELETE | `/{category_id}` | Admin | Soft delete category |

### 6.3 Product Routes — `/api/v1/products`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List products (paginated, filtered) |
| GET | `/{product_id}` | Public | Get product detail |
| GET | `/slug/{slug}` | Public | Get product by slug |
| POST | `/` | Admin | Create product |
| PATCH | `/{product_id}` | Admin | Update product |
| DELETE | `/{product_id}` | Admin | Soft delete product |
| PATCH | `/{product_id}/stock` | Admin | Update stock quantity |

**Query Parameters for GET `/products`:**
```
?page=1&page_size=20&category_id=uuid&min_price=100&max_price=5000
&in_stock=true&search=laptop&sort_by=price_asc
```

### 6.4 Cart Routes — `/api/v1/cart`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Bearer | Get current user's cart |
| POST | `/items` | Bearer | Add item to cart |
| PATCH | `/items/{item_id}` | Bearer | Update item quantity |
| DELETE | `/items/{item_id}` | Bearer | Remove item from cart |
| DELETE | `/` | Bearer | Clear entire cart |

### 6.5 Order Routes — `/api/v1/orders`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Bearer | Create order from cart |
| GET | `/` | Bearer | List own orders (paginated) |
| GET | `/{order_id}` | Bearer | Get own order detail |
| POST | `/{order_id}/cancel` | Bearer | Cancel own pending order |
| GET | `/admin/all` | Admin | List all orders |
| PATCH | `/admin/{order_id}/status` | Admin | Update order status |

### 6.6 User Admin Routes — `/api/v1/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Admin | List all users (paginated) |
| GET | `/{user_id}` | Admin | Get user detail |
| PATCH | `/{user_id}/activate` | Admin | Activate/deactivate user |

---

## 7. Authentication & Authorization

### 7.1 JWT Strategy

```python
# utils/security.py
ACCESS_TOKEN_EXPIRE = 30        # minutes
REFRESH_TOKEN_EXPIRE = 7 * 24 * 60  # 7 days in minutes
ALGORITHM = "HS256"

def create_access_token(data: dict) -> str:
    payload = {**data, "type": "access", "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE)}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    payload = {**data, "type": "refresh", "exp": datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE)}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)
```

### 7.2 Dependencies

```python
# dependencies.py
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    # Decode JWT, fetch user, check is_active
    ...

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

### 7.3 Password Hashing

```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

---

## 8. Error Handling Strategy

### 8.1 Global Exception Handlers

```python
# main.py — register on app startup
@app.exception_handler(RequestValidationError)
async def validation_error_handler(request, exc):
    return JSONResponse(status_code=422, content={
        "error": "VALIDATION_ERROR",
        "message": "Request validation failed",
        "details": [{"field": e["loc"][-1], "message": e["msg"]} for e in exc.errors()]
    })

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content={
        "error": exc.detail.get("code", "HTTP_ERROR"),
        "message": exc.detail.get("message", str(exc.detail))
    })
```

### 8.2 Standard Error Response Format

```json
{
  "error": "PRODUCT_NOT_FOUND",
  "message": "Product with id 'abc-123' does not exist",
  "details": null
}
```

### 8.3 Custom Exception Classes

```python
# utils/exceptions.py
class ProductNotFoundException(HTTPException):
    def __init__(self, product_id: str):
        super().__init__(status_code=404, detail={"code": "PRODUCT_NOT_FOUND", "message": f"Product '{product_id}' not found"})

class InsufficientStockException(HTTPException):
    def __init__(self, product_name: str, available: int):
        super().__init__(status_code=409, detail={"code": "INSUFFICIENT_STOCK", "message": f"Only {available} units of '{product_name}' available"})

class EmptyCartException(HTTPException):
    def __init__(self):
        super().__init__(status_code=400, detail={"code": "EMPTY_CART", "message": "Cart is empty. Add items before placing order"})
```

---

## 9. Environment Configuration

### 9.1 `.env` File

```env
# App
APP_NAME=ECommerceAPI
APP_VERSION=1.0.0
DEBUG=false
SECRET_KEY=your-super-secret-key-at-least-32-chars

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/ecommerce_db

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=["http://localhost:3000","https://your-frontend.com"]

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### 9.2 Settings Class

```python
# config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "ECommerceAPI"
    debug: bool = False
    secret_key: str
    database_url: str
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    allowed_origins: list[str] = []
    default_page_size: int = 20
    max_page_size: int = 100

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

settings = Settings()
```

---

## 10. ORM Models (SQLAlchemy)

### 10.1 Base Model with Timestamps

```python
# models/base.py
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from datetime import datetime
import uuid

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

### 10.2 User Model

```python
# models/user.py
import uuid
from sqlalchemy import String, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    role: Mapped[str] = mapped_column(SAEnum("customer", "admin", name="user_role"), default="customer")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    cart: Mapped["Cart"] = relationship("Cart", back_populates="user", uselist=False)
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="user")
```

### 10.3 Product Model

```python
# models/product.py
import uuid
from decimal import Decimal
from sqlalchemy import String, Text, Numeric, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin

class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    compare_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    category: Mapped["Category"] = relationship("Category", back_populates="products")
```

### 10.4 Order Model

```python
# models/order.py
import uuid
from decimal import Decimal
from sqlalchemy import Numeric, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin

class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        SAEnum("pending","confirmed","processing","shipped","delivered","cancelled","refunded", name="order_status"),
        default="pending", nullable=False
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    shipping_address: Mapped[dict] = mapped_column(JSONB, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order")
    payment: Mapped["Payment"] = relationship("Payment", back_populates="order", uselist=False)
```

---

## 11. Alembic Migrations

### 11.1 Setup

```bash
alembic init alembic
# Edit alembic/env.py to use async engine and import all models
```

### 11.2 `alembic/env.py` key config

```python
from app.config import settings
from app.models.base import Base
from app.models import user, category, product, cart, order, payment  # import all

config.set_main_option("sqlalchemy.url", settings.database_url)
target_metadata = Base.metadata
```

### 11.3 Workflow

```bash
# Generate migration
alembic revision --autogenerate -m "initial_schema"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1

# View history
alembic history
```

---

## 12. Deployment on Render.com

### 12.1 `Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8000 --timeout 120"]
```

### 12.2 `render.yaml` (Infrastructure as Code)

```yaml
services:
  - type: web
    name: ecommerce-api
    env: docker
    plan: free
    dockerfilePath: ./Dockerfile
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: ecommerce-db
          property: connectionString
      - key: DEBUG
        value: false
      - key: ACCESS_TOKEN_EXPIRE_MINUTES
        value: 30
    healthCheckPath: /api/v1/health
    autoDeploy: true

databases:
  - name: ecommerce-db
    plan: free
    databaseName: ecommerce_db
    user: ecommerce_user
```

### 12.3 `docker-compose.yml` (Local Dev)

```yaml
version: "3.9"
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/ecommerce_dev
      - SECRET_KEY=dev-secret-key-change-in-prod
      - DEBUG=true
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - .:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ecommerce_dev
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  pg_data:
```

### 12.4 Deployment Steps

```bash
# 1. Push code to GitHub
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/your/ecommerce-api.git
git push -u origin main

# 2. Go to render.com → New → Blueprint → Connect GitHub repo
# 3. Render reads render.yaml and provisions DB + API automatically
# 4. Set any secret env vars in Render Dashboard
# 5. Monitor build logs → API live at https://ecommerce-api.onrender.com
```

---

## 13. Day Timeline Breakdown

| Time Block | Task | Hours |
|---|---|---|
| 07:00 – 08:00 | Project setup: FastAPI skeleton, Docker, folder structure, requirements | 1h |
| 08:00 – 09:00 | SQLAlchemy models + Alembic migrations + DB connection | 1h |
| 09:00 – 10:30 | Auth system: register, login, JWT, refresh, middleware | 1.5h |
| 10:30 – 12:00 | Categories + Products CRUD with slugs, filtering, pagination | 1.5h |
| 12:00 – 12:30 | Lunch break | 0.5h |
| 12:30 – 14:00 | Cart service: add/update/remove/clear with stock checks | 1.5h |
| 14:00 – 15:30 | Order service: checkout from cart, status transitions, payment record | 1.5h |
| 15:30 – 16:30 | Admin routes, error handlers, global exception middleware | 1h |
| 16:30 – 17:30 | Write tests (auth + products + cart) with pytest + HTTPX | 1h |
| 17:30 – 18:00 | Dockerfile + render.yaml + GitHub push + Render deployment | 0.5h |
| **Total** | | **~10h** |

---

## 14. Testing Strategy

### 14.1 `tests/conftest.py`

```python
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.main import app
from app.database import get_db
from app.models.base import Base

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/ecommerce_test"

@pytest.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(engine):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
```

### 14.2 Sample Test

```python
# tests/test_auth.py
async def test_register_success(client):
    res = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "Test@1234",
        "full_name": "Test User"
    })
    assert res.status_code == 201
    assert "access_token" in res.json()

async def test_register_duplicate_email(client):
    # first register
    await client.post("/api/v1/auth/register", json={...})
    # second register with same email
    res = await client.post("/api/v1/auth/register", json={...})
    assert res.status_code == 409
    assert res.json()["error"] == "EMAIL_ALREADY_EXISTS"
```

### 14.3 Run Tests

```bash
pytest tests/ -v --asyncio-mode=auto --cov=app --cov-report=html
```

---

## 15. Security Checklist

| Item | Status | Implementation |
|---|---|---|
| Password hashing | ✅ | bcrypt via passlib |
| JWT expiry | ✅ | 30min access / 7d refresh |
| SQL injection prevention | ✅ | SQLAlchemy ORM (parameterized) |
| Input validation | ✅ | Pydantic v2 strict mode |
| CORS whitelist | ✅ | Configured via env |
| Rate limiting | ⚠️ | Add slowapi (post-MVP) |
| HTTPS | ✅ | Render provides SSL cert |
| Secrets in env | ✅ | pydantic-settings + .env |
| Admin role guard | ✅ | Dependency injection |
| Soft deletes only | ✅ | is_active flag on models |
| Stock race condition | ✅ | SELECT FOR UPDATE on checkout |
| Request size limit | ✅ | Uvicorn default 1MB |

---

## Appendix: `requirements.txt`

```
fastapi==0.111.0
uvicorn[standard]==0.30.1
gunicorn==22.0.0
sqlalchemy[asyncio]==2.0.30
asyncpg==0.29.0
alembic==1.13.1
pydantic[email]==2.7.1
pydantic-settings==2.2.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
httpx==0.27.0
pytest==8.2.0
pytest-asyncio==0.23.7
pytest-cov==5.0.0
ruff==0.4.4
```

---

*Document End — E-Commerce API BRD v1.0.0*
