// MongoDB initialization script for auth_db
// This script runs when the container starts for the first time

// Switch to auth_db database
db = db.getSiblingDB('auth_db');

// Create application user with appropriate permissions
db.createUser({
  user: 'auth_user',
  pwd: 'auth_password_secure_456',
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
print('✅ User auth_user created with readWrite permissions');
print('✅ Performance indexes created');