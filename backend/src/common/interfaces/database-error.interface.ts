export interface MongoDBError {
  code: number;
  message: string;
  collection?: string;
  operation?: string;
  keyPattern?: Record<string, any>;
  keyValue?: Record<string, any>;
  errorLabels?: string[];
}
