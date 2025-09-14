# API Documentation

This document provides comprehensive documentation for all API endpoints in the new-smell project.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
6. [Rate Limiting](#rate-limiting)
7. [Validation](#validation)
8. [Examples](#examples)

## Overview

The new-smell API provides endpoints for managing perfumes, users, ratings, comments, and wishlists. All endpoints follow RESTful conventions and return JSON responses.

**Base URL**: `https://api.new-smell.com/v1`

**Content-Type**: `application/json`

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-01-01T00:00:00Z"
  }
}
```

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": <response-data>,
  "message": "Optional success message",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address",
      "code": "invalid_string"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (validation failed)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Types

- **ValidationError**: Invalid input data
- **AuthenticationError**: Invalid or missing authentication
- **AuthorizationError**: Insufficient permissions
- **NotFoundError**: Resource not found
- **ConflictError**: Duplicate resource
- **ServerError**: Internal server error

## Endpoints

### Authentication

#### POST /api/auth/login

Authenticate user and return JWT token.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/auth/register

Register a new user account.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/auth/logout

Logout user and invalidate token.

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Perfumes

#### GET /api/perfumes

Get list of perfumes with filtering and pagination.

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `search` (string): Search query
- `house` (string): Filter by perfume house
- `type` (string): Filter by perfume type
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sortBy` (string): Sort field (name, price, rating, createdAt)
- `sortOrder` (string): Sort direction (asc, desc)

**Example Request**:

```http
GET /api/perfumes?page=1&limit=20&search=chanel&sortBy=name&sortOrder=asc
```

**Response**:

```json
{
  "success": true,
  "data": {
    "perfumes": [
      {
        "id": "perfume_123",
        "name": "Chanel No. 5",
        "description": "A timeless classic...",
        "house": {
          "id": "house_123",
          "name": "Chanel"
        },
        "price": 120.0,
        "image": "https://example.com/image.jpg",
        "rating": 4.5,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET /api/perfumes/:id

Get specific perfume by ID.

**Path Parameters**:

- `id` (string): Perfume ID

**Response**:

```json
{
  "success": true,
  "data": {
    "perfume": {
      "id": "perfume_123",
      "name": "Chanel No. 5",
      "description": "A timeless classic...",
      "house": {
        "id": "house_123",
        "name": "Chanel"
      },
      "price": 120.0,
      "image": "https://example.com/image.jpg",
      "rating": 4.5,
      "reviews": [
        {
          "id": "review_123",
          "user": {
            "id": "user_123",
            "firstName": "John",
            "lastName": "Doe"
          },
          "rating": 5,
          "comment": "Amazing fragrance!",
          "createdAt": "2024-01-01T00:00:00Z"
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### POST /api/perfumes

Create a new perfume (Admin only).

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "name": "New Perfume",
  "description": "A wonderful new fragrance",
  "houseId": "house_123",
  "price": 150.0,
  "image": "https://example.com/image.jpg"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "perfume": {
      "id": "perfume_456",
      "name": "New Perfume",
      "description": "A wonderful new fragrance",
      "house": {
        "id": "house_123",
        "name": "Chanel"
      },
      "price": 150.0,
      "image": "https://example.com/image.jpg",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Ratings

#### POST /api/ratings

Submit a rating for a perfume.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "perfumeId": "perfume_123",
  "longevity": 4,
  "sillage": 3,
  "gender": 5,
  "priceValue": 4,
  "overall": 4
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "rating": {
      "id": "rating_123",
      "perfumeId": "perfume_123",
      "userId": "user_123",
      "longevity": 4,
      "sillage": 3,
      "gender": 5,
      "priceValue": 4,
      "overall": 4,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### PUT /api/ratings/:id

Update an existing rating.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters**:

- `id` (string): Rating ID

**Request Body**:

```json
{
  "longevity": 5,
  "sillage": 4,
  "overall": 5
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "rating": {
      "id": "rating_123",
      "perfumeId": "perfume_123",
      "userId": "user_123",
      "longevity": 5,
      "sillage": 4,
      "gender": 5,
      "priceValue": 4,
      "overall": 5,
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### DELETE /api/ratings/:id

Delete a rating.

**Headers**:

```
Authorization: Bearer <token>
```

**Path Parameters**:

- `id` (string): Rating ID

**Response**:

```json
{
  "success": true,
  "message": "Rating deleted successfully"
}
```

### Comments

#### POST /api/comments

Add a comment to a perfume.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "perfumeId": "perfume_123",
  "userPerfumeId": "user_perfume_123",
  "comment": "This is a great fragrance!",
  "isPublic": true
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "comment_123",
      "perfumeId": "perfume_123",
      "userPerfumeId": "user_perfume_123",
      "userId": "user_123",
      "comment": "This is a great fragrance!",
      "isPublic": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### PUT /api/comments/:id

Update a comment.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters**:

- `id` (string): Comment ID

**Request Body**:

```json
{
  "comment": "Updated comment text",
  "isPublic": false
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "comment_123",
      "perfumeId": "perfume_123",
      "userPerfumeId": "user_perfume_123",
      "userId": "user_123",
      "comment": "Updated comment text",
      "isPublic": false,
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### DELETE /api/comments/:id

Delete a comment.

**Headers**:

```
Authorization: Bearer <token>
```

**Path Parameters**:

- `id` (string): Comment ID

**Response**:

```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### Wishlist

#### GET /api/wishlist

Get user's wishlist.

**Headers**:

```
Authorization: Bearer <token>
```

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)

**Response**:

```json
{
  "success": true,
  "data": {
    "wishlist": [
      {
        "id": "wishlist_123",
        "perfume": {
          "id": "perfume_123",
          "name": "Chanel No. 5",
          "price": 120.0,
          "image": "https://example.com/image.jpg"
        },
        "addedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### POST /api/wishlist

Add perfume to wishlist.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "perfumeId": "perfume_123"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Added to wishlist"
}
```

#### DELETE /api/wishlist/:perfumeId

Remove perfume from wishlist.

**Headers**:

```
Authorization: Bearer <token>
```

**Path Parameters**:

- `perfumeId` (string): Perfume ID

**Response**:

```json
{
  "success": true,
  "message": "Removed from wishlist"
}
```

### User Perfumes

#### GET /api/user-perfumes

Get user's perfume collection.

**Headers**:

```
Authorization: Bearer <token>
```

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)

**Response**:

```json
{
  "success": true,
  "data": {
    "userPerfumes": [
      {
        "id": "user_perfume_123",
        "perfume": {
          "id": "perfume_123",
          "name": "Chanel No. 5",
          "price": 120.0,
          "image": "https://example.com/image.jpg"
        },
        "amount": "100ml",
        "available": "50ml",
        "price": 120.0,
        "tradePrice": 100.0,
        "tradePreference": "both",
        "tradeOnly": false,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### POST /api/user-perfumes

Add perfume to user's collection.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "perfumeId": "perfume_123",
  "amount": "100ml",
  "price": 120.0,
  "tradePrice": 100.0,
  "tradePreference": "both"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "userPerfume": {
      "id": "user_perfume_123",
      "perfumeId": "perfume_123",
      "userId": "user_123",
      "amount": "100ml",
      "available": "100ml",
      "price": 120.0,
      "tradePrice": 100.0,
      "tradePreference": "both",
      "tradeOnly": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### PUT /api/user-perfumes/:id

Update user's perfume collection item.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters**:

- `id` (string): User perfume ID

**Request Body**:

```json
{
  "amount": "80ml",
  "available": "30ml",
  "price": 110.0,
  "tradePrice": 90.0
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "userPerfume": {
      "id": "user_perfume_123",
      "perfumeId": "perfume_123",
      "userId": "user_123",
      "amount": "80ml",
      "available": "30ml",
      "price": 110.0,
      "tradePrice": 90.0,
      "tradePreference": "both",
      "tradeOnly": false,
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### DELETE /api/user-perfumes/:id

Remove perfume from user's collection.

**Headers**:

```
Authorization: Bearer <token>
```

**Path Parameters**:

- `id` (string): User perfume ID

**Response**:

```json
{
  "success": true,
  "message": "Removed from collection"
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **Search endpoints**: 50 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

When rate limited, a `429` status code is returned:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Validation

All API endpoints use comprehensive validation with detailed error messages:

### Request Validation

- **Required fields**: Validated for presence
- **Data types**: Validated for correct types
- **Format validation**: Email, URL, phone number formats
- **Range validation**: Numeric ranges, string lengths
- **Custom validation**: Business logic validation

### Error Response Format

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please enter a valid email address",
      "code": "invalid_string",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long",
      "code": "too_small",
      "value": "weak"
    }
  ]
}
```

## Examples

### Complete Authentication Flow

```javascript
// 1. Register user
const registerResponse = await fetch("/api/auth/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "user@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
  }),
});

const {
  data: { token },
} = await registerResponse.json();

// 2. Use token for authenticated requests
const perfumesResponse = await fetch("/api/perfumes", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const {
  data: { perfumes },
} = await perfumesResponse.json();
```

### Search and Filter Perfumes

```javascript
const searchPerfumes = async (query, filters = {}) => {
  const params = new URLSearchParams({
    search: query,
    page: filters.page || 1,
    limit: filters.limit || 20,
    ...filters,
  });

  const response = await fetch(`/api/perfumes?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

// Usage
const results = await searchPerfumes("chanel", {
  minPrice: 100,
  maxPrice: 200,
  sortBy: "price",
  sortOrder: "asc",
});
```

### Rate a Perfume

```javascript
const ratePerfume = async (perfumeId, ratings) => {
  const response = await fetch("/api/ratings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      perfumeId,
      ...ratings,
    }),
  });

  return response.json();
};

// Usage
await ratePerfume("perfume_123", {
  longevity: 4,
  sillage: 3,
  gender: 5,
  priceValue: 4,
  overall: 4,
});
```

### Add to Wishlist

```javascript
const addToWishlist = async (perfumeId) => {
  const response = await fetch("/api/wishlist", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ perfumeId }),
  });

  return response.json();
};

// Usage
await addToWishlist("perfume_123");
```

This API documentation provides comprehensive information for integrating with the new-smell API. For additional support or questions, please refer to the project repository or contact the development team.
