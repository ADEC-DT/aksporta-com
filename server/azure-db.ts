import sql from 'mssql';
import { ClientSecretCredential } from '@azure/identity';

let pool: sql.ConnectionPool | null = null;

async function getAccessToken(): Promise<string> {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Azure AD credentials not configured. Please set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET');
  }

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const tokenResponse = await credential.getToken('https://database.windows.net/.default');
  
  if (!tokenResponse) {
    throw new Error('Failed to obtain Azure AD access token');
  }

  return tokenResponse.token;
}

export async function getAzureConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  const server = process.env.AZURE_SQL_SERVER;
  const database = process.env.AZURE_SQL_DATABASE;

  if (!server || !database) {
    throw new Error('Azure SQL Server or Database not configured. Please set AZURE_SQL_SERVER and AZURE_SQL_DATABASE');
  }

  try {
    const accessToken = await getAccessToken();

    const config: sql.config = {
      server: server,
      database: database,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
      authentication: {
        type: 'azure-active-directory-access-token',
        options: {
          token: accessToken,
        },
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    pool = await sql.connect(config);
    console.log('Connected to Azure SQL Database via Azure AD');
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
