import sql from 'mssql';

const config: sql.config = {
  server: process.env.AZURE_SQL_SERVER || '',
  database: process.env.AZURE_SQL_DATABASE || '',
  user: process.env.AZURE_SQL_USER || '',
  password: process.env.AZURE_SQL_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getAzureConnection(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool;
  }
  
  try {
    pool = await sql.connect(config);
    console.log('Connected to Azure SQL Database');
    return pool;
  } catch (error) {
    console.error('Azure SQL connection error:', error);
    throw error;
  }
}

export async function queryAzureDB<T>(query: string, params?: Record<string, any>): Promise<T[]> {
  const connection = await getAzureConnection();
  const request = connection.request();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
  }
  
  const result = await request.query(query);
  return result.recordset as T[];
}

export async function testAzureConnection(): Promise<boolean> {
  try {
    const connection = await getAzureConnection();
    await connection.request().query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Azure SQL connection test failed:', error);
    return false;
  }
}

export async function getAzureTables(): Promise<string[]> {
  try {
    const result = await queryAzureDB<{ TABLE_NAME: string }>(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
    );
    return result.map(row => row.TABLE_NAME);
  } catch (error) {
    console.error('Error fetching Azure tables:', error);
    return [];
  }
}

export async function getTableData(tableName: string, limit: number = 100): Promise<any[]> {
  try {
    const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const result = await queryAzureDB(
      `SELECT TOP ${limit} * FROM [${safeName}]`
    );
    return result;
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return [];
  }
}

export async function getTableSchema(tableName: string): Promise<any[]> {
  try {
    const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const result = await queryAzureDB(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = @tableName 
       ORDER BY ORDINAL_POSITION`,
      { tableName: safeName }
    );
    return result;
  } catch (error) {
    console.error(`Error fetching schema for ${tableName}:`, error);
    return [];
  }
}
