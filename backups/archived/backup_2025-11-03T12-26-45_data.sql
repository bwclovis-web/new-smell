-- Database Backup Generated: 2025-11-03T12:26:45.741Z
-- Total Records: 2

-- Disable foreign key checks
SET session_replication_role = replica;

-- Data for table: User
-- Count: 2 records

INSERT INTO "User" (id, email, password, firstName, lastName, username, createdAt, updatedAt, role) VALUES ('cmgchfpcp0000obckvijsygpq', 'me@you.com', '2b52496fcf3bf890827f09f0c200297f:$2b$12$SVrdCqdb3pm2BHDvAaCYg.3vPLlXvX5tCJfvtI5HL87gox4dI5q02', NULL, NULL, NULL, '2025-10-04T16:23:27.769Z', '2025-10-04T16:23:27.769Z', 'user');
INSERT INTO "User" (id, email, password, firstName, lastName, username, createdAt, updatedAt, role) VALUES ('cmd292ipa0000ob7gcnmfy9nr', 'bwclovis.web@gmail.com', '$2b$10$f1jMCQ1x/CKXqinB1ragAe5aefQKrvBOwGqFZxV4drNIDp0ZPoox6', 'Brian', 'Clovis', 'AngelFodderTest', '2025-07-13T22:32:26.926Z', '2025-11-01T14:44:16.797Z', 'admin');

-- No data in PerfumeHouse
-- No data in Perfume
-- No data in UserPerfume
-- No data in UserPerfumeRating
-- No data in UserPerfumeReview
-- No data in UserPerfumeWishlist
-- No data in UserPerfumeComment
-- No data in PerfumeNotes
-- No data in WishlistNotification
-- No data in SecurityAuditLog
-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;
