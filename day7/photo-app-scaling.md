## 1. ASSUMPTIONS AND DAILY ACTIVE USERS

SnapShare is a photo-sharing application where users upload photos and view a feed of photos from people they follow.

The following assumptions are made:

- There are 10,000,000 registered users
- Daily active users (DAU): 10% of registered users.
- Each daily active user uploads 1 photo per day.
- Each daily active user views 50 feed pages per day.
- Each original photo uses 2 MB of storage.
- Each thumbnail uses 50 KB, equivalent to 0.05 MB.
- The application operates 24 hours per day, 365 days per year.
- Traffic is distributed evenly throughout the day when calculating average rates.
- Peak traffic is estimated at five times the average rate.
- Each feed page view is counted as one feed request.
- Storage calculations exclude backups, replicas, metadata, and additional image sizes.

**Now, the calculations**

## 1. Daily Active Users calculation:

DAU = Registered users × Daily active percentage
DAU = 10,000,000 × 10%

**Therefore**
Daily active users = 1,000,000 users.

## 2. Traffic and Storage Calculations:

### A. Photo uploads per second

Each of the 1,000,000 daily active users uploads one photo per day.

Daily uploads:

1,000,000 × 1 = 1,000,000 uploads per day.

Average uploads per second:

1,000,000 ÷ 100, 000 = 10 uploads per second.

Peak uploads per second:

10 × 5 = 50 uploads per second.

Therefore:

- **Average:** 10 uploads/second.
- **Peak:** 50 uploads/second.

### B. Feed views per second

Each daily active user views 50 feed pages per day.

Daily feed views:

1,000,000 × 50 = 50,000,000 feed views per day.

Average feed views per second:

50,000,000 ÷ 100,000 = 500 feed views per second.

Peak feed views per second:

500 × 5 = 2,500 feed views per second.

Therefore:

- **Average:** 500 feed views/second.
- **Peak:** 2,500 feed views/second.

### C. Photo storage per year

Storage required per photo, including its thumbnail:

- Original photo: 2 MB.
- Thumbnail: 0.05 MB.
- Total: 2.05 MB per uploaded photo.

Daily storage:

1,000,000 × 2.05 MB = 2,050,000 MB per day, or approximately 2.05 TB per day using decimal units.

Annual storage:

2.05 TB × 365 = 748.25 TB per year.

**Estimated annual storage: 748.25 TB**, excluding backups, replicas, metadata, and other copies.

### Summary table

| Metric                 | Average or total |  Peak |
| ---------------------- | ---------------: | ----: |
| Daily active users     |        1,000,000 |     — |
| Photo uploads/second   |               10 |    50 |
| Feed views/second      |              500 | 2,500 |
| New photo storage/day  |          2.05 TB |     — |
| New photo storage/year |        748.25 TB |     — |

## 3. IS SnapShare READ-HEAVY OR WRITE-HEAVY?

SnapShare is a **read-heavy system** because users view feed pages much more frequently than they upload photos.

Each user uploads one photo but views 50 feed pages daily. This means the application handles about 50 feed views for every photo upload.

This affects the design in several ways:

- Use a cache to reduce repeated database queries.
- Use a Content Delivery Network (CDN) to serve photos efficiently from locations close to users.
- Use database read replicas to handle additional read queries.
- Use pagination so that the application loads only a manageable number of feed items at a time.
- Scale application servers horizontally to handle increases in traffic.

The system must still support reliable photo uploads, but its feed-reading workload is likely to require more capacity.

## 4. WHY PHOTOS SHOULD NOT BE STORED INSIDE THE DATABASE

Photos should not normally be stored directly inside the main relational database as large binary objects due to the following reasons:

- **Storage efficiency:** Large photos can make database storage grow quickly.
- **Performance:** Large binary objects can increase database backup, restore, and query overhead.
- **Scalability:** Object storage is designed to store large amounts of files independently of application servers.
- **Delivery speed:** A CDN can cache and deliver images without requiring every image request to reach the database.
- **Cost management:** Object storage can provide more economical storage options for large media collections.

## 5. Architecture Diagram

                         USERS
                           |
             +-------------+-------------+
             |                           |
         Feed requests              Photo uploads
             |                           |
             v                           v
      +-------------+             +----------------+
      |     CDN     |             | Load Balancer  |
      | Serves      |             +----------------+
      | cached      |                     |
      | images      |                     v
      +-------------+              +-------------+
             ^                     | Application |
             |                     | Servers     |
             |                     +-------------+
             |                       |    |    |
             |             +---------+    |    +-----------+
             |             |              |                |
             |             v              v                v
             |         +--------+   +-------------+  +-------------+
             |         | Cache  |   | Primary DB  |  | Object      |
             |         | Feed   |   | Users, posts|  | Storage     |
             |         | data   |   | and metadata|  | Original    |
             |         +--------+   +-------------+  | photos      |
             |                           |            +-------------+
             |                           v                   ^
             |                    +-------------+             |
             |                    | Read Replica|             |
             |                    +-------------+             |
             |                                                |
             |                   +-------------+              |
             |                   | Message     |              |
             |                   | Queue       |              |
             |                   +-------------+              |
             |                         |                      |
             |                         v                      |
             |                   +-------------+              |
             |                   | Thumbnail   |--------------+
             |                   | Worker      |
             |                   +-------------+
             |                         |
             |                         v
             |                   +-------------+
             +-------------------| CDN delivers|
                                 | cached images|
                                 +-------------+

## 6. ARCHITECTURE DESIGN EXPLANATION

1. Users: Upload photos and request feeds containing photos from accounts they follow.
2. CDN (Content Delivery Network): Caches and delivers photos and thumbnails efficiently, reducing load on the application and object storage.
3. Load balancer: Distributes incoming application requests across available application servers.
4. Application servers: Handle business logic, validate uploads, manage feed requests, and communicate with the cache, database, and storage.
5. Cache: Keeps frequently requested feed data and metadata available in fast memory to reduce database queries.
6. Primary database: Stores structured information such as users, posts, follows, captions, and photo-storage references.
7. Read replica: Handles suitable read queries to reduce the workload on the primary database, although replication may introduce a small delay.
8. Object storage: Stores original photos and generated thumbnails separately from the relational database.
9. Message queue: Holds thumbnail-processing jobs until a worker can process them, helping prevent upload requests from waiting for image processing.
10. Thumbnail worker: Processes queued jobs to create smaller versions of uploaded photos and stores the results in object storage.

## 7. UPLOAD FLOW

11. The user selects a photo and submits it through the application.
12. The load balancer directs the upload request to an available application server.
13. The application server validates the request, including file type, file size, and user permissions.
14. The original photo is uploaded to object storage, either through the application server or using a secure, time-limited upload URL.
15. The application records the photo's metadata and storage reference in the primary database.
16. The application places a thumbnail-generation job in the message queue.
17. The application confirms the upload once the original photo and required metadata have been safely saved.
18. A thumbnail worker retrieves the job and generates a smaller version of the photo.
19. The worker saves the thumbnail in object storage and updates any necessary processing status.
20. When users view the photo in their feeds, the CDN serves the original image or thumbnail, using cached copies where available.

## 8. TRADE-OFFS

**A. Caching versus data freshness**

Caching reduces response times and database load, but cached feed information may become outdated when a user uploads a photo or changes a follow relationship.

**Trade-off:** Used caching for performance, together with cache expiration or invalidation rules for important changes.

**B. Database read replicas versus consistency**

Read replicas increase read capacity, but replication delays can mean a user does not immediately see newly saved information.

**Trade-off:** Used replicas for most feed-reading operations, while sending operations that require immediate consistency to the primary database.
