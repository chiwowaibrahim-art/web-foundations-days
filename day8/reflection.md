
# Day 8 Reflection

## What was the most difficult concept in the course

The most difficult concept in this course was understanding how a system can handle many users at the same time without producing incorrect results. At first, it was easy to think that checking whether a seat was available on the website was enough. However, I learned that two customers could see the same available seat and attempt to buy it simultaneously. I overcame this difficulty by studying database transactions, row-level locking, and unique constraints. Applying these concepts to TicketHub helped me understand why the database must be the final authority when deciding who owns a seat.

## Which part of my capstone I would improve 

Based on the feedback I received on my capstone, I would improve the clarity and completeness of my system design documentation. I would explain the assumptions behind my traffic estimates more carefully and make the relationships between the API, database, and architecture diagram easier to follow. I would also improve my testing plan to cover simultaneous seat requests, expired holds, repeated payment requests, and payment failures. These improvements would help demonstrate not only how the system is designed but also how its correctness could be tested.

## What will I learn next

The next thing, I would like to learn more is backend development, SQL, database transactions, and API security. I would also like to practise building and deploying a working application that uses a real database and a payment-provider sandbox. 