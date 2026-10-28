# TicketHub: System Design Document

## 1. Requirements

TicketHub is an online ticketing platform where users can discover concerts and events, view available seats, reserve seats, pay for tickets, and access their purchased tickets.

### 1.1 Functional requirements

The system must allow users to:

1. Register, log in, and manage their accounts.
2. Browse upcoming events and search or filter events by name, date, location, and category.
3. View event details, ticket prices, and a seat map showing available, held, and sold seats.
4. Temporarily hold available seats while completing payment.
5. Pay for held seats and receive confirmation of a successful order.
6. View their purchased tickets and order history.
7. Receive a unique ticket for each purchased seat.
8. Receive clear messages when a seat is unavailable or a payment fails.
9. Cancel eligible orders and receive refunds according to the event's cancellation policy.

### 1.2 Non-functional requirements

**Speed:** Event pages and seat maps should load within two seconds under normal conditions. During a major sale, the system should aim to return most API responses within three seconds, excluding delays caused by external payment providers.

**Correctness:** A seat must never be sold to two customers for the same event. Orders, payments, seat holds, and ticket issuance must remain consistent, even when requests arrive simultaneously or a service fails.

**Fairness:** Customers should receive a fair opportunity to purchase tickets. A waiting room should control the flow of customers into the booking system, using a transparent queue order. The system should limit automated abuse, repeated requests, and attempts to bypass the queue.

**Availability:** Browsing and ticket purchasing should remain available during high-demand sales. If payment or another critical service becomes unavailable, the system must fail safely instead of confirming uncompleted purchases.

**Scalability:** The application must handle sudden increases in visitors without requiring every component to be permanently sized for the largest possible sale.

**Security:** Users must access only their own orders and tickets. Payments must use a trusted payment provider, and sensitive payment card details should not be stored by TicketHub.

**Maintainability:** The system should use clearly separated components, logs, monitoring, automated tests, and documented APIs so developers can identify and fix problems.

---

## 2. Traffic Estimates

TicketHub has 2 million registered users. The estimates below use the supplied traffic figures and clearly stated assumptions.

### 2.1 Normal-day traffic

Assumptions:
- 50,000 people visit the website each day.
- Each visitor views 10 pages.
- 5,000 tickets are sold daily.
- A normal day's traffic is spread across 24 hours.
- For capacity planning, peak traffic is assumed to be five times the daily average. Actual traffic should be measured after launch.

**Page views per day:**

50,000 visitors × 10 pages = 500,000 page views per day.

**Average page requests per second:**

500,000 ÷ 100,000 seconds ≈ 5 requests per second.

**Estimated normal peak:**

5 × 5 ≈ 25 page requests per second.

**Average ticket sales per second:**

5,000 ÷ 100,000 ≈ 0.05 tickets per second.

This averages approximately one ticket sale every 17 seconds. Actual sales will not be evenly distributed throughout the day.

### 2.2 Big-sale traffic

For a popular concert:
- 200,000 people attempt to buy tickets within 10 minutes.
- Only 20,000 seats are available.

**Purchase attempts per second:**

200,000 ÷ (10 × 60) ≈ 333 people per second.

**Seat availability rate:**

20,000 ÷ 600 ≈ 33 seats per second.

**Demand compared with supply:**

200,000 ÷ 20,000 = 10.

There are ten potential buyers for every available seat. Therefore, at most 10% of the 200,000 people can obtain one seat each, assuming each person wants one seat and all seats are sold.

For infrastructure planning, assume each buyer generates five API requests during the sale, including seat-map access, seat selection, hold requests, and order-related requests.

Estimated big-sale API demand:

333 buyers per second × 5 requests = approximately 1,667 API requests per second.

This is a planning assumption, not a measured request rate. Retries, browsing traffic, and automated abuse could increase the actual load.

### 2.3 Comparison

| Measure | Normal day | Big sale |
|---|---:|---:|
| Visitors or purchase attempts | 50,000 visitors/day | 200,000 attempts in 10 minutes |
| Page views | 500,000/day | Depends on browsing behaviour |
| Average page requests | 5.8/second | Not directly equivalent |
| Estimated API demand | About 5.8 requests/second before peak adjustment | About 1,667 requests/second |
| Tickets available or sold | 5,000 sold/day | 20,000 seats available |
| Main challenge | Reliable everyday service | Extreme concurrency and oversubscription |

The big sale creates a much greater short-term load than normal traffic. The most difficult problem is not only serving requests quickly; it is safely deciding which customers receive the limited seats.

The architecture must therefore control incoming traffic, keep seat availability accurate, and protect the database from conflicting booking requests.

---

## 3. API Design

The API follows REST principles. The example base URL is `https://api.tickethub.example.com/v1`. It is a proposed address, not a live service.

| Method and endpoint | Purpose | Successful response |
|---|---|---|
| GET `/events` | Browse and search events | 200 OK |
| GET `/events/{eventId}` | View event details | 200 OK |
| GET `/events/{eventId}/seats` | View seat availability and prices | 200 OK |
| POST `/seat-holds` | Temporarily hold available seats | 201 Created |
| POST `/orders` | Create an order for held seats | 201 Created |
| POST `/orders/{orderId}/payment` | Start or confirm payment through a trusted provider | 202 Accepted |
| GET `/tickets` | View the authenticated user's tickets | 200 OK |
| GET `/orders/{orderId}` | View order and payment status | 200 OK |

### 3.1 Browsing events

Request:

`GET /v1/events?date=2027-06-15&category=concert`

Example response:

```json
{
  "events": [
    {
      "id": 101,
      "name": "Summer Music Concert",
      "date": "2027-06-15T18:00:00Z",
      "venue": "Central Arena",
      "startingPrice": 25000,
      "currency": "MWK"
    }
  ]
}
```

The endpoint supports pagination and filtering. Public event details can be cached to reduce database load.

### 3.2 Viewing seats

Request:

`GET /v1/events/101/seats`

Example response:

```json
{
  "eventId": 101,
  "seats": [
    {
      "id": 501,
      "label": "A1",
      "price": 25000,
      "status": "available"
    },
    {
      "id": 502,
      "label": "A2",
      "price": 25000,
      "status": "held"
    }
  ]
}
```

Seat availability can change immediately after the response is returned. The server must check availability again when a customer requests a hold.

### 3.3 Holding seats

Request:

`POST /v1/seat-holds`

Example request body:

```json
{
  "eventId": 101,
  "seatIds": [501],
  "idempotencyKey": "hold-unique-request-001"
}
```

Example response:

```json
{
  "holdId": "hold-9001",
  "status": "held",
  "expiresAt": "2027-06-15T17:05:00Z"
}
```

A hold expires after a short period, such as five minutes. If the hold expires without a successful purchase, the seat becomes available again.

The server must reject a hold if the requested seat is already sold or actively held by another customer.

### 3.4 Creating an order

Request:

`POST /v1/orders`

Example request body:

```json
{
  "holdId": "hold-9001",
  "idempotencyKey": "order-unique-request-001"
}
```

Example response:

```json
{
  "orderId": "order-7001",
  "status": "pending_payment",
  "amount": 25000,
  "currency": "MWK"
}
```

The server verifies that the hold belongs to the authenticated user and has not expired. The order amount is calculated on the server rather than trusted from the browser.

### 3.5 Processing payment

Request:

`POST /v1/orders/order-7001/payment`

Example request body:

```json
{
  "paymentMethodToken": "token-from-payment-provider",
  "idempotencyKey": "payment-unique-request-001"
}
```

Example response:

```json
{
  "orderId": "order-7001",
  "paymentStatus": "processing"
}
```

The payment provider processes the transaction and sends a verified webhook to TicketHub. TicketHub marks the order as paid and issues tickets only after confirming successful payment.

Repeated payment requests with the same idempotency key must not charge the customer twice.

### 3.6 Viewing tickets

Request:

`GET /v1/tickets`

Example response:

```json
{
  "tickets": [
    {
      "ticketId": "ticket-3001",
      "eventId": 101,
      "seatLabel": "A1",
      "status": "valid"
    }
  ]
}
```

The server identifies the user from their authenticated session or access token and returns only tickets belonging to that user.

### 3.7 Error handling

The API should use consistent HTTP status codes:

- `400 Bad Request`: Invalid request data.
- `401 Unauthorized`: User is not authenticated.
- `403 Forbidden`: User cannot access the requested resource.
- `404 Not Found`: Event, seat, order, or ticket does not exist.
- `409 Conflict`: Seat is unavailable, a hold has expired, or an order conflicts with current state.
- `429 Too Many Requests`: The client has exceeded its rate limit.
- `500 Internal Server Error`: Unexpected server failure.
- `503 Service Unavailable`: The service cannot safely process requests temporarily.

Example error response:

```json
{
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "This seat is no longer available.",
    "requestId": "req-12345"
  }
}
```

---

## 4. Data Model

TicketHub uses a relational database such as PostgreSQL because seat ownership, orders, and payments require strong consistency and transaction support.

The core design contains five tables: `users`, `events`, `seats`, `orders`, and `order_items`. A separate payment table can be added to record payment attempts and provider references.

### 4.1 Tables and relationships

**Users**
- `id`: Primary key.
- `name`: Customer's name.
- `email`: Customer's email; unique and not null.
- `password_hash`: Secure password hash.
- `created_at`: Account creation timestamp.

**Events**
- `id`: Primary key.
- `name`: Event name.
- `description`: Event description.
- `venue`: Event location.
- `starts_at`: Event start time.
- `status`: Draft, published, cancelled, or completed.

**Seats**
- `id`: Primary key.
- `event_id`: Foreign key referencing `events.id`.
- `seat_label`: Seat label within the event.
- `price`: Price in the event's currency.
- `status`: Available, held, or sold.
- `held_by_user_id`: Nullable foreign key referencing `users.id`.
- `hold_expires_at`: Nullable timestamp.
- `order_id`: Nullable reference to the order that purchased the seat.

**Orders**
- `id`: Primary key.
- `user_id`: Foreign key referencing `users.id`.
- `status`: Pending payment, paid, cancelled, or refunded.
- `total_amount`: Total order amount.
- `currency`: Currency code.
- `idempotency_key`: Unique key for preventing duplicate order creation.
- `created_at`: Order creation timestamp.

**Order items**
- `id`: Primary key.
- `order_id`: Foreign key referencing `orders.id`.
- `seat_id`: Foreign key referencing `seats.id`.
- `price_at_purchase`: Price recorded at purchase time.
- A unique constraint on `seat_id` prevents the same seat from being attached to multiple orders.

A production implementation should use a payment table with payment status, provider reference, amount, currency, and unique provider transaction identifiers.

### 4.2 Relationships

- One user can create many orders.
- One event can contain many seats.
- One order can contain multiple order items.
- Each order item refers to one seat.
- A seat can belong to no more than one successful order.
- A user can temporarily hold multiple seats, subject to ticket limits.

### 4.3 Example SQL schema

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    venue VARCHAR(200) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    CHECK (status IN ('draft', 'published', 'cancelled', 'completed'))
);

CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending_payment',
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    currency CHAR(3) NOT NULL,
    idempotency_key VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (status IN (
        'pending_payment', 'paid', 'cancelled', 'refunded'
    ))
);

CREATE TABLE seats (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id),
    seat_label VARCHAR(30) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    held_by_user_id BIGINT REFERENCES users(id),
    hold_expires_at TIMESTAMPTZ,
    order_id BIGINT REFERENCES orders(id),
    UNIQUE (event_id, seat_label),
    CHECK (status IN ('available', 'held', 'sold'))
);

CREATE TABLE order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    seat_id BIGINT NOT NULL UNIQUE REFERENCES seats(id),
    price_at_purchase NUMERIC(12, 2) NOT NULL
        CHECK (price_at_purchase >= 0)
);

CREATE INDEX idx_events_status_start
    ON events (status, starts_at);

CREATE INDEX idx_seats_event_status
    ON seats (event_id, status);

CREATE INDEX idx_orders_user_created
    ON orders (user_id, created_at DESC);
```

The unique constraint on `(event_id, seat_label)` prevents duplicate seat labels within the same event. The unique constraint on `order_items.seat_id` prevents a seat from being assigned to multiple order items.

In a complete implementation, the application must also enforce valid state transitions and ensure that the seat's `order_id`, `status`, and order-item record agree. These operations should be performed in one database transaction.

---

## 5. Architecture and Preventing Double-Booking

### 5.1 Architecture diagram

```
flowchart TD
    U[Customers and Browsers] --> W[Waiting Room and Queue]
    W --> DNS[DNS]
    DNS --> CDN[CDN for Static Assets]
    CDN --> LB[Load Balancer]
    LB --> A1[Application Server 1]
    LB --> A2[Application Server 2]
    LB --> A3[Application Server 3]
    A1 --> C[Cache for Public Event Data]
    A2 --> C
    A3 --> C
    A1 --> DB[(Primary Relational Database)]
    A2 --> DB
    A3 --> DB
    DB --> RR[(Read Replica)]
    DB --> Q[Message Queue]
    Q --> WK[Background Workers]
    WK --> N[Email and Ticket Notifications]
    A1 --> P[External Payment Provider]
    A2 --> P
    A3 --> P
    P --> WH[Verified Payment Webhook]
    WH --> A1
```

### 5.2 Components and responsibilities

**Customers and browsers:** Users search for events, choose seats, pay, and access tickets.

**Waiting room and queue:** Controls the number of customers entering the purchasing workflow during a major sale. It should use a transparent queue policy, signed queue tokens, and rate limits to discourage bypassing the queue.

**DNS:** Directs users to the correct public endpoint.

**CDN:** Delivers static assets such as images, JavaScript, CSS, and public event artwork. It reduces traffic reaching the application servers.

**Load balancer:** Distributes API requests across healthy application servers and stops sending requests to unhealthy instances.

**Application servers:** Validate requests, authenticate users, apply business rules, and communicate with the database and payment provider. Multiple servers allow horizontal scaling.

**Cache:** Stores frequently requested public event information. Seat availability and purchase decisions must be verified against the authoritative database; cached seat data must never be used as the final booking decision.

**Primary relational database:** Stores authoritative seat status, holds, orders, and ticket ownership. Database transactions and constraints protect correctness.

**Read replica:** Serves suitable read-heavy queries, such as some event and reporting requests. It may lag behind the primary database, so booking decisions and payment confirmation must use the primary database.

**Message queue and workers:** Handle non-critical work, such as sending email confirmations and generating notifications. Durable messages and retry handling help prevent lost notifications.

**Payment provider and webhook:** Processes payments securely and reports payment outcomes. Webhooks must be authenticated and processed idempotently.

### 5.3 How the system prevents two people buying the same seat

The system must never depend only on the browser's seat map or a cached availability result. Two customers could view the same available seat at nearly the same time.

TicketHub prevents double-booking through a combination of temporary holds, database transactions, row locking, and unique constraints.

**Step 1: Customer requests a hold.**

The application starts a database transaction and locks the requested seat row using a mechanism such as `SELECT ... FOR UPDATE`.

**Step 2: The database checks the current state.**

The application checks whether the seat is available or has a hold that has expired. It performs this check while holding the row lock, so another transaction cannot simultaneously make a conflicting change to the same row.

**Step 3: The seat is held atomically.**

If the seat is available, the application updates its status to `held`, records the user's ID, and sets a short expiration time. The transaction commits. If another customer tries to hold the same seat, that request must wait and then observe that the seat is already held or sold.

Illustrative SQL:

```sql
BEGIN;

SELECT id, status, held_by_user_id, hold_expires_at
FROM seats
WHERE id = 501
FOR UPDATE;

-- Application checks the locked row.
-- If available or expired, assign the hold and expiration.

UPDATE seats
SET status = 'held',
    held_by_user_id = 42,
    hold_expires_at = NOW() + INTERVAL '5 minutes'
WHERE id = 501;

COMMIT;
```

This illustrates the locking pattern. In production, the application must check the locked row's state before executing the update and roll back if the seat cannot be held. It must not blindly update the seat as shown in isolation.

**Step 4: Customer pays.**

The customer can pay only for a valid hold belonging to them. The application creates an order and initiates payment with the provider.

**Step 5: Successful payment is confirmed.**

After verifying the payment result, the application opens another transaction. It locks the relevant seat and order records, verifies that the hold and payment are valid, inserts the order item, changes the seat status to `sold`, and marks the order as `paid`. These database changes commit together.

The unique constraint on `order_items.seat_id` acts as a final safeguard against assigning the same seat to multiple orders.

**Step 6: Failed or abandoned purchases are handled safely.**

If payment fails or the hold expires, the system releases the seat only when the hold still belongs to that attempt and has expired. A delayed payment response must not overwrite a newer hold or incorrectly release a seat.

If payment succeeds after a hold has expired and the seat has already been sold to another customer, the system must not issue a duplicate ticket. It should reconcile the payment and refund the customer or follow a clearly defined recovery process.

**Important:** External payment processing cannot be made part of a single ordinary database transaction. TicketHub therefore uses explicit order states, verified webhooks, idempotency keys, reconciliation, and compensating actions such as refunds.

### 5.4 Surviving the big sale

TicketHub handles the sudden increase in traffic through several measures:

1. **Waiting room:** Limits how many customers enter the seat-selection and checkout process at once.
2. **Horizontal scaling:** Adds application servers when demand rises.
3. **Caching:** Serves public event information without repeatedly querying the primary database.
4. **Database protection:** Uses connection pooling, indexed queries, short transactions, and row-level locking to control contention.
5. **Rate limiting:** Restricts abusive clients and excessive repeated requests.
6. **Idempotency:** Prevents repeated hold, order, and payment requests from creating duplicate effects.
7. **Asynchronous notifications:** Keeps email and notification work out of the critical purchase path.
8. **Monitoring and recovery:** Tracks queue length, response time, database locks, payment failures, and error rates. Failed workers and messages can be retried safely.

The queue should not promise tickets simply because a customer entered it. The primary database remains the source of truth for actual seat ownership.

---

## 6. Trade-Offs

### Trade-off 1: Strong consistency versus performance

Strongly consistent seat checks require database coordination and locking. During a major sale, many customers may request the same seats, causing transactions to wait and increasing response times.

TicketHub chooses correctness over accepting every request immediately. It uses short transactions, row-level locking, appropriate indexes, and a waiting room to control contention. It can cache public event data, but it does not trust cached availability when assigning seats.

### Trade-off 2: Waiting room fairness versus immediate access

A waiting room reduces pressure on the application and database, but customers may have to wait before purchasing. Without a clear policy, users could also believe that the queue is unfair.

TicketHub uses a documented queue policy, rate limits, and observable queue status. It should apply the same rules consistently and communicate that joining the queue does not guarantee a ticket. A randomized queue for everyone arriving before a published cutoff may be appropriate for exceptionally high-demand events, while first-in-first-out processing can be used in other situations.

### Trade-off 3: Read replicas versus up-to-date information

Read replicas can handle large numbers of event and reporting queries, but replication delay can make information stale.

TicketHub uses replicas for suitable read-heavy operations, while seat holds, final seat assignment, and order confirmation use the primary database. This adds database complexity but protects booking correctness.

### Trade-off 4: Short seat holds versus customer convenience

Short holds allow more customers to access limited seats, but some customers may lose a hold while completing payment. Longer holds improve convenience but can leave seats unavailable to others.

TicketHub uses a short, clearly displayed hold period and releases expired holds safely. It communicates expiration times and supports idempotent payment handling and payment reconciliation to reduce confusion.

---

## Conclusion

TicketHub must be designed around both scalability and correctness. Normal traffic can be handled using a modest application tier, caching, and a relational database. A popular concert sale requires a waiting room, horizontally scalable application servers, controlled database access, and careful payment processing.

The most important design decision is that the database—not the browser, cache, or waiting room—determines whether a seat can be held and sold. Transactions, row locks, unique constraints, and safe payment recovery prevent double-booking while allowing the system to serve a large number of customers.
