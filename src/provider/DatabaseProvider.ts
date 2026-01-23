import 'dotenv/config';
import { Injectable, Scope, OnApplicationShutdown } from '@nestjs/common';
import * as mongoose from 'mongoose';

@Injectable({ scope: Scope.REQUEST })
export class DatabaseProvider implements OnApplicationShutdown {
  private static connection: mongoose.Connection | null = null;
  private dbConnection: mongoose.Connection;

  constructor() {
    this.dbConnection = this.getOrCreateConnection();
  }

  private getOrCreateConnection(): mongoose.Connection {
    const mongoUrl =
      process.env.MONGODB_URL ||
      'mongodb+srv://asadalidev512:asadalidev512@love.5zpstbw.mongodb.net/?appName=Love';

    // If connection already exists, reuse it
    if (DatabaseProvider.connection) {
      return DatabaseProvider.connection;
    }

    // Otherwise create new connection
    const connection = mongoose.createConnection(mongoUrl!, {
      connectTimeoutMS: 2000000,
      socketTimeoutMS: 45000000,
      serverSelectionTimeoutMS: 60000000,
      maxPoolSize: 50,
      minPoolSize: 10,
    });

    connection.on('connected', () => console.log(`MongoDB connected`));

    connection.on('error', (error) =>
      console.error(`MongoDB connection error:`, error),
    );

    DatabaseProvider.connection = connection;
    return connection;
  }

  getConnection(): mongoose.Connection {
    return this.dbConnection;
  }

  async onApplicationShutdown() {
    console.log('Shutting down MongoDB connection...');

    if (DatabaseProvider.connection) {
      try {
        await DatabaseProvider.connection.close();
        console.log(`MongoDB connection closed`);
      } catch (error) {
        console.error(`Error closing MongoDB connection:`, error);
      }
    }

    DatabaseProvider.connection = null; // reset
  }
}
