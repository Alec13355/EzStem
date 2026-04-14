"""
Provisions the App Service Managed Identity as a db_owner in Azure SQL.
Connects using an Azure AD access token (provided via env vars).

Required env vars:
  SQL_SERVER   - short server name (e.g. ezstem-dev-sql)
  DB_NAME      - database name    (e.g. ezstem-dev-db)
  APP_MI_NAME  - managed identity display name (e.g. ezstem-dev-api)
  ACCESS_TOKEN - Azure AD token for https://database.windows.net/
"""
import pyodbc
import struct
import os
import sys

server   = os.environ["SQL_SERVER"]
db       = os.environ["DB_NAME"]
mi_name  = os.environ["APP_MI_NAME"]
token    = os.environ["ACCESS_TOKEN"]

token_bytes  = token.encode("utf-16-le")
token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

drivers = [d for d in pyodbc.drivers() if "SQL Server" in d]
if not drivers:
    print("ERROR: No SQL Server ODBC driver found", file=sys.stderr)
    sys.exit(1)
driver = drivers[-1]
print(f"Using driver: {driver}")

conn_str = (
    f"DRIVER={{{driver}}};"
    f"SERVER={server}.database.windows.net;"
    f"DATABASE={db};"
    "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30"
)

try:
    conn   = pyodbc.connect(conn_str, attrs_before={1256: token_struct})
    cursor = conn.cursor()
    cursor.execute(f"""
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'{mi_name}')
BEGIN
    EXEC('CREATE USER [{mi_name}] FROM EXTERNAL PROVIDER')
    EXEC('ALTER ROLE db_owner ADD MEMBER [{mi_name}]')
    PRINT 'SQL user created'
END
ELSE PRINT 'SQL user already exists'
""")
    conn.commit()
    print(f"SQL user provisioned: {mi_name}")
except pyodbc.Error as e:
    print(f"ERROR connecting to SQL: {e}", file=sys.stderr)
    sys.exit(1)
