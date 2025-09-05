// Switch to auth_db database
db = db.getSiblingDB('auth_db');

// Get credentials from environment variables (no fallback passwords for security)
const appUser = process.env.MONGODB_APP_USER;
const appPassword = process.env.MONGODB_APP_PASSWORD;

// Validate that required environment variables are set
if (!appUser || !appPassword) {
    throw new Error('MONGODB_APP_USER and MONGODB_APP_PASSWORD environment variables must be set');
}

// Create application user with appropriate permissions
db.createUser({
    user: appUser,
    pwd: appPassword,
    roles: [
        {
            role: 'readWrite',
            db: 'auth_db'
        }
    ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ isActive: 1 });

db.refresh_tokens.createIndex({ userId: 1, isRevoked: 1 });
db.refresh_tokens.createIndex({ tokenHash: 1 }, { unique: true });
db.refresh_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

print('✅ Database auth_db initialized successfully');
print(`✅ User ${appUser} created with readWrite permissions`);
print('✅ Performance indexes created');
