# Sterling's Blog - Server-Side Data Sync

This is Sterling's personal blog with server-side data synchronization for site stats, suggestions, and dev log posts.

## Features

- **Server-side Site Stats**: Visitor count, site age, and uptime tracking
- **Global Suggestions**: User suggestions are now synced across all instances
- **Shared Dev Log**: Dev log posts are visible to all visitors
- **Admin Panel**: Manage all content through the admin interface
- **Fallback Support**: Graceful degradation to localStorage if server is unavailable

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3001`

### 3. Access the Website

- **Main Site**: `http://localhost:3001`
- **Admin Panel**: `http://localhost:3001/admin/`
- **Home Page**: `http://localhost:3001/home/`

## API Endpoints

### Site Stats
- `GET /api/stats` - Get current site statistics
- `POST /api/stats` - Update visitor count

### Suggestions
- `GET /api/suggestions` - Get all suggestions
- `POST /api/suggestions` - Add a new suggestion
- `DELETE /api/suggestions/:id` - Delete a suggestion

### Dev Log
- `GET /api/devlog` - Get all dev log posts
- `POST /api/devlog` - Add a new dev log post
- `DELETE /api/devlog/:id` - Delete a dev log post

### Admin Data
- `GET /api/admin/:type` - Get admin data by type
- `POST /api/admin/:type` - Update admin data by type

## Data Storage

All data is stored in JSON files in the `data/` directory:
- `siteStats.json` - Site statistics
- `suggestions.json` - User suggestions
- `devLogPosts.json` - Dev log posts
- Other admin data files as needed

## Admin Panel

Access the admin panel at `/admin/` with the password: `Sterling123`

The admin panel allows you to:
- Manage dev log posts
- View and delete suggestions
- Reset visitor count
- Manage quotes and other content
- Export/import data

## Development

To run in development mode:
```bash
npm run dev
```

## Deployment

For production deployment, you can:
1. Set the `PORT` environment variable
2. Use a process manager like PM2
3. Set up reverse proxy with nginx

Example with PM2:
```bash
npm install -g pm2
pm2 start server.js --name "sterling-blog"
```

## Troubleshooting

- If the server fails to start, check that port 3001 is available
- If data isn't syncing, check the browser console for API errors
- The site will fallback to localStorage if the server is unavailable
- Check the `data/` directory for JSON files to verify data persistence
# Deployment test
