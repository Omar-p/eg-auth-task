import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST || 'localhost';
  const port = process.env.MONGODB_PORT || '27017';
  const database = process.env.MONGODB_DATABASE || 'auth_db';

  // Build connection string
  let uri = `mongodb://`;

  if (username && password) {
    uri += `${username}:${password}@`;
  }

  uri += `${host}:${port}/${database}`;

  // For production DocumentDB, add query parameters in URI (match AWS docs format)
  if (process.env.NODE_ENV === 'production') {
    uri += `?tls=true&tlsCAFile=/opt/global-bundle.pem&retryWrites=false&authMechanism=SCRAM-SHA-1&authSource=admin&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000`;
  }

  // Add connection options
  const options = {
    // For production DocumentDB, minimal options as per AWS docs
    ...(process.env.NODE_ENV === 'production' && {
      w: 'majority',
      ssl: true,
    }),
    // For local development with MongoDB
    ...(process.env.NODE_ENV !== 'production' && {
      authSource: 'admin',
      retryWrites: true,
      w: 'majority',
    }),
  };

  // Log connection details (without sensitive info) for debugging
  console.log('Database Configuration:', {
    host,
    port: parseInt(port, 10),
    database,
    username: username ? '[REDACTED]' : 'none',
    nodeEnv: process.env.NODE_ENV,
    uriPattern: uri.replace(password || '', '[REDACTED]')
  });

  return {
    uri,
    options,
    host,
    port: parseInt(port, 10),
    database,
    username,
    password,
  };
});
