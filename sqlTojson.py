import pyodbc
import json
from pathlib import Path
import config

# ------------------------------------------------------------
# FUNCTION: CONNECT WITH MFA (Interactive)
# ------------------------------------------------------------
def get_connection():
    """
    Connects using Azure Active Directory Interactive MFA.
    Note: Ensure your 'config.py' has the correct Database and Server.
    """
    # Active Directory Interactive is the standard for MFA prompts
    conn_str = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        f"SERVER={config.DB_SERVER};"
        f"DATABASE={config.DB_NAME};"
        "Authentication=ActiveDirectoryInteractive;" 
        f"UID={config.DB_USER};" # Your Entrata/AD email address
    )
    
    try:
        # No 'PWD' needed here; the browser handles the password/MFA
        print(">>> OPENING BROWSER FOR MFA AUTHENTICATION...")
        return pyodbc.connect(conn_str)
    except Exception as e:
        print(f">>> ERROR: Connection failed. Check your VPN or UID. \n{e}")
        raise

# ------------------------------------------------------------
# FUNCTION: RUN QUERY (With Context Managers)
# ------------------------------------------------------------
def run_query_to_json(sql: str):
    # Using 'with' ensures the connection closes automatically
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql)

            if cursor.description is None:
                return {"message": "Success, but no rows returned."}

            columns = [col[0] for col in cursor.description]
            
            # Generator expression to handle rows one-by-one (memory efficient)
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

# ------------------------------------------------------------
# MAIN EXECUTION
# ------------------------------------------------------------
if __name__ == "__main__":
    try:
        sql_path = Path("sale.sql")
        if not sql_path.exists():
            print(f"Error: {sql_path} not found.")
        else:
            query = sql_path.read_text(encoding="utf-8")
            data = run_query_to_json(query)

            output = Path("output.json")
            output.write_text(json.dumps(data, indent=4, default=str))
            print(f">>> SUCCESS: Data exported to {output.resolve()}")
            
    except Exception as e:
        print(f">>> CRITICAL FAILURE: {e}")