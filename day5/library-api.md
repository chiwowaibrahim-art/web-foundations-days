
# Library Books REST API Design

## Overview

This API manages books in a library.

**Base URL:** `https://api.example.com`

## Endpoints

### 1. List all books

- **Method:** GET
- **Path:** `/books`
- **Description:** Returns all books in the library.
- **Request body:** None.
- **Success status:** `200 OK`

### 2. Get one book

- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Returns a specific book using its ID.
- **Request body:** None.
- **Success status:** `200 OK`

### 3. Create a book

- **Method:** POST
- **Path:** `/books`
- **Description:** Creates a new book.
- **Example request body:**

  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "publicationYear": 1958,
    "isbn": "9780385474542"
  }
  ```

- **Success status:** `201 Created`

### 4. Update a book

- **Method:** PUT
- **Path:** `/books/{id}`
- **Description:** Updates the details of an existing book.
- **Example request body:**

  ```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "publicationYear": 1958,
    "isbn": "9780385474542"
  }
  ```

- **Success status:** `200 OK`

### 5. Delete a book

- **Method:** DELETE
- **Path:** `/books/{id}`
- **Description:** Deletes a book using its ID.
- **Request body:** None.
- **Success status:** `204 No Content`

### 6. List books by author

- **Method:** GET
- **Path:** `/books?author=Chinua%20Achebe`
- **Description:** Returns books matching the author query parameter.
- **Request body:** None.
- **Success status:** `200 OK`

## Error Responses

- **400 Bad Request:** The request contains invalid data, such as a missing required title when creating a book.
- **404 Not Found:** The requested book does not exist, such as when requesting `GET /books/9999` for an ID that is not present.

## Notes

- `{id}` represents the unique ID assigned to a book.
- The API should validate input before creating or updating records.
- Successful responses containing data should return JSON.
- Error responses should explain what went wrong.
