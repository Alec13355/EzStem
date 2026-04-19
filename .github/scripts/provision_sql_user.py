"""
Provisions the App Service Managed Identity as a db_owner in Azure SQL.
Connects using an Azure AD access token (provided via env vars).

Uses CREATE USER ... WITH SID=<bytes>, TYPE=E instead of FROM EXTERNAL PROVIDER
so the SQL Server does NOT need Directory Readers on its own AAD identity.
SQL Server's token auth matches the incoming MI token's 'oid' claim against this SID.
The SID is the MI object ID GUID in mixed-endian (Windows / SQL Server) byte order.

Always drops and recreates so a re-deployed App Service (new MI SID) never keeps
a stale principal.

Required env vars:
  SQL_SERVER   - short server name (e.g. ezstem-dev-sql)
  DB_NAME      - database name    (e.g. ezstem-dev-db)
  APP_MI_NAME  - managed identity display name (e.g. ezstem-dev-api)
  APP_MI_OID   - object ID (GUID) of the App Service managed identity
  ACCESS_TOKEN - Azure AD token for https://database.windows.net/
"""
import pyodbc
import struct
import uuid
import os
import sys

server   = os.environ["SQL_SERVER"]
db       = os.environ["DB_NAME"]
mi_name  = os.environ["APP_MI_NAME"]
mi_oid   = os.environ["APP_MI_OID"]
token    = os.environ["ACCESS_TOKEN"]

# Build the SQL SID from the MI object ID.
# uuid.bytes_le gives the Windows mixed-endian layout that SQL Server uses
# for AAD principals — Data1/2/3 little-endian, Data4 big-endian.
sid_hex = "0x" + uuid.UUID(mi_oid).bytes_le.hex().upper()

token_bytes  = token.encode("utf-16-le")
token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

drivers = [d for d in pyodbc.drivers() if "SQL Server" in d]
if not drivers:
    print("ERROR: No SQL Server ODBC driver found", file=sys.stderr)
    sys.exit(1)
driver = drivers[-1]
print(f"Using driver: {driver}")
print(f"Provisioning MI '{mi_name}' (OID: {mi_oid})")

conn_str = (
    f"DRIVER={{{driver}}};"
    f"SERVER={server}.database.windows.net;"
    f"DATABASE={db};"
    "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30"
)

try:
    conn   = pyodbc.connect(conn_str, attrs_before={1256: token_struct})
    cursor = conn.cursor()
    # Drop and recreate with explicit SID — avoids FROM EXTERNAL PROVIDER which
    # requires Directory Readers on the SQL Server's AAD identity.
    cursor.execute(f"""
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'{mi_name}')
BEGIN
    ALTER ROLE db_owner DROP MEMBER [{mi_name}]
    DROP USER [{mi_name}]
    PRINT 'Dropped existing SQL user'
END
CREATE USER [{mi_name}] WITH SID = {sid_hex}, TYPE = E
ALTER ROLE db_owner ADD MEMBER [{mi_name}]
PRINT 'SQL user created and granted db_owner'
""")
    conn.commit()
    print(f"SQL user provisioned: {mi_name}")
except pyodbc.Error as e:
    print(f"ERROR provisioning SQL user: {e}", file=sys.stderr)
    sys.exit(1)
