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

  // For production DocumentDB, add query parameters in URI
  if (process.env.NODE_ENV === 'production') {
    uri += `?tls=true&tlsCAFile=/opt/global-bundle.pem&retryWrites=false&authSource=admin`;
  }

  // Add connection options
  const options = {
    w: 'majority',
    // For local development with MongoDB admin user
    ...(process.env.NODE_ENV !== 'production' && {
      authSource: 'admin',
      retryWrites: true, // MongoDB supports retryWrites
    }),
  };

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
