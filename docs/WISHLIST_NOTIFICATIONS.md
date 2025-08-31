# Wishlist Notification System

This system automatically notifies users when perfumes from their wishlist become available in the trading post.

## Features

- **Automatic Detection**: Monitors when perfumes on user wishlists become available for decanting
- **Duplicate Prevention**: Tracks which users have been notified to prevent spam
- **Email Notifications**: Ready for integration with email services
- **Admin Interface**: Manual trigger for notification processing
- **API Endpoint**: RESTful API for notification processing
- **Scheduled Processing**: Cron job script for automated processing

## Components

### 1. Database Schema

- `WishlistNotification` model tracks which users have been notified about which perfumes
- Relations to `User` and `Perfume` models

### 2. Backend Services

- `app/models/wishlist.server.ts`: Enhanced to include trading post availability
- `app/models/notification.server.ts`: Notification logic and database operations

### 3. Frontend UI

- `app/routes/admin/Wishlist.tsx`: Enhanced wishlist page with availability highlighting
- `app/routes/admin/notification-processor.tsx`: Manual notification processor interface

### 4. API & Processing

- `app/routes/api/process-wishlist-notifications.tsx`: API endpoint for processing
- `app/utils/wishlist-notification-processor.ts`: Core notification processing logic
- `scripts/process-notifications.js`: Cron job script for automated processing

## How It Works

### 1. Wishlist Monitoring

When users view their wishlist (`/admin/wishlist`), the system:

- Checks if any wishlist items are available in the trading post
- Highlights available items with special styling
- Shows seller contact information with mailto links

### 2. Notification Processing

The notification system:

1. Finds all wishlist items that have become available
2. Checks if users have already been notified (prevents duplicates)
3. Marks notifications as sent in the database
4. Can send email notifications (placeholder implemented)

### 3. Available Interfaces

#### Manual Processing (Admin Interface)

Visit `/admin/notification-processor` to manually trigger notification processing.

#### API Endpoint

```bash
POST /api/process-wishlist-notifications
```

Response:

```json
{
  "success": true,
  "processed": 3,
  "notifications": [
    {
      "userId": "user123",
      "perfumeId": "perfume456",
      "perfumeName": "Sample Perfume",
      "sellers": [
        {
          "userId": "seller789",
          "email": "seller@example.com"
        }
      ]
    }
  ]
}
```

#### Automated Processing (Cron Job)

Use the provided script for scheduled processing:

```bash
# Run manually
node scripts/process-notifications.js

# Add to crontab (run every hour)
0 * * * * cd /path/to/your/project && node scripts/process-notifications.js

# Windows Task Scheduler
# Program: node.exe
# Arguments: C:\path\to\your\project\scripts\process-notifications.js
# Start in: C:\path\to\your\project
```

## Configuration

### Environment Variables

- `APP_URL`: Base URL of your application (default: http://localhost:2112)
- `LOCAL_DATABASE_URL`: PostgreSQL connection string

### Email Integration

To enable actual email notifications, integrate an email service in:
`app/utils/wishlist-notification-processor.ts` -> `sendWishlistNotificationEmail()`

Popular options:

- SendGrid
- AWS SES
- Nodemailer with SMTP
- Mailgun
- Postmark

## Database Migration

The system adds a new `WishlistNotification` table. If you haven't run the migration yet:

```bash
npx prisma migrate dev --name add-wishlist-notifications
```

## Usage Examples

### Check for notifications programmatically:

```typescript
import { processWishlistNotifications } from "~/utils/wishlist-notification-processor";

const results = await processWishlistNotifications();
console.log(`Processed ${results.length} notifications`);
```

### Mark a user as notified manually:

```typescript
import { markAsNotified } from "~/models/notification.server";

await markAsNotified("userId", "perfumeId");
```

### Get user's notification history:

```typescript
import { getWishlistNotifications } from "~/models/notification.server";

const notifications = await getWishlistNotifications("userId");
```

## UI Features

### Wishlist Page Enhancements

- Items available in trading post are highlighted with green styling
- Shows availability banner with celebration emoji
- Displays seller information and contact details
- Provides direct mailto links for contacting sellers
- Shows total available quantity across all sellers

### Visual Indicators

- Green gradient background for available items
- Ring border effect to draw attention
- Animated "AVAILABLE IN TRADING POST!" banner
- Seller contact cards with email integration

## Troubleshooting

### Common Issues

1. **Notifications not processing**: Check database connection and ensure the API endpoint is accessible
2. **Duplicate notifications**: The system prevents duplicates automatically via the `WishlistNotification` table
3. **Email not sending**: Implement actual email service in `sendWishlistNotificationEmail()`
4. **Cron job not running**: Ensure Node.js is in PATH and the script has proper permissions

### Logs

The system logs important events:

- Notification processing start/completion
- Number of notifications processed
- Individual notification details
- Error handling

Check your application logs or use the admin interface to monitor processing.
