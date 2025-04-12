npm run dev

node -- 20.17.0

# MUA Backend

A Node.js backend server for the MUA application with Express and Supabase integration.

## Requirements

- Node.js 18.x or higher
- npm 9.x or higher
- PostgreSQL (via Supabase)

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd MUA-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# Supabase Transaction Pooler Configuration
DB_HOST=aws-0-ap-south-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.dmmefaeprkgkzpoxvoje
DB_PASSWORD=your-password
DB_POOL_MODE=transaction

# Supabase URL and Keys
SUPABASE_URL=https://dmmefaeprkgkzpoxvoje.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

> **Important Note**: The connection to Supabase requires specific configuration for the transaction pooler. Make sure to use the correct host, port, and user format as shown above.

### 4. Database Configuration

This project uses Supabase for the PostgreSQL database. The connection is configured in `src/config/database.js`.

Key points about the database connection:
- Uses the Supabase transaction pooler for connection pooling
- SSL certificate validation is disabled for development (should be enabled in production)
- The user format must include the project ID: `postgres.PROJECT_ID`

## Running the Application

### Development Mode

To run the application in development mode with automatic reloading:

```bash
npm run dev
```

### Production Mode

To run the application in production mode:

```bash
npm start
```

## API Endpoints

### Health Check

```
GET /api/health
```

Returns the status of the database connections.

### Products

```
GET /api/products
```

Returns a list of all products.

### Users

```
GET /api/users
```

Returns a list of all users.

## Project Structure

```
MUA-backend/
├── src/                  # Source code
│   ├── config/           # Configuration files
│   │   ├── database.js   # Database connection setup
│   │   └── supabase.js   # Supabase client setup
│   ├── routes/           # API routes
│   │   ├── products.js   # Products endpoints
│   │   └── users.js      # Users endpoints
│   └── index.js          # Main application entry point
├── migrations/           # Database migrations
├── scripts/              # Utility scripts
├── .env                  # Environment variables
├── package.json          # Project dependencies
└── README.md             # Project documentation
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues, check the following:

1. **SSL Certificate Errors**: Make sure `NODE_TLS_REJECT_UNAUTHORIZED='0'` is set in development. For production, use proper certificate validation.

2. **Authentication Errors**: Ensure the DB_USER includes the project ID in the format `postgres.PROJECT_ID`.

3. **Pooler Connection**: Double-check that you're using the transaction pooler hostname and port (6543).

4. **Network Issues**: Verify that your network allows connections to the Supabase servers.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 