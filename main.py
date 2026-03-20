import pyodbc
import json
import getpass
from pathlib import Path
import config

def authenticate_user():
    """Checks console input against credentials.json"""
    username = input("Username: ").strip()
    password = getpass.getpass("Password: ")

    try:
        creds_path = Path("credentials.json")
        data = json.loads(creds_path.read_text())
        
        # Find user and capture their jurisdiction and county
        user = next((u for u in data['users'] if u['username'] == username and u['password'] == password), None)
        
        if user:
            print(f">>> Welcome, {user['username']}!")
            print(f">>> Target: {user['county']} County (Jurisdiction: {user['jurisdiction']})")
            return user
        else:
            print(">>> ERROR: Invalid credentials.")
            return None
    except Exception as e:
        print(f">>> ERROR: {e}")
        return None

def main():
    user_context = authenticate_user()
    if not user_context:
        return

    try:
        # 1. Load the SQL template
        sql_file = Path("sale.sql")
        query = sql_file.read_text(encoding="utf-8")

        # 2. Setup Connection using the County from credentials
        prefix = config.COUNTY_SERVERS.get(user_context['county'])
        full_server = f"{prefix}{config.SERVER_SUFFIX}"
        
        conn_str = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={full_server};"
            f"DATABASE={config.DB_NAME};"
            "Authentication=ActiveDirectoryInteractive;"
            f"UID={config.DB_USER};"
        )

        print(f"\n>>> Connecting to {full_server}...")
        with pyodbc.connect(conn_str) as conn:
            with conn.cursor() as cursor:
                
                # 3. DYNAMIC EXECUTION
                # We pass user_context['jurisdiction'] as the second argument
                # This replaces the '?' in your SQL file
                print(f">>> Running query for Jurisdiction: {user_context['jurisdiction']}...")
                cursor.execute(query, user_context['jurisdiction'])
                
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]

                # 4. Save Output
                output = Path("output.json")
                output.write_text(json.dumps(results, indent=4, default=str))
                print(f">>> SUCCESS: {len(results)} rows saved to {output.name}")

    except Exception as e:
        print(f">>> CRITICAL ERROR: {e}")

if __name__ == "__main__":
    main()