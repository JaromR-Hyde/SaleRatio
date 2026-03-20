import pyodbc
import json
import getpass
from pathlib import Path
import config
import webbrowser
import os

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

def authenticate_user():
    username = input("Username: ").strip()
    password = getpass.getpass("Password: ")
    try:
        data = json.loads(Path("credentials.json").read_text())
        user = next((u for u in data['users'] if u['username'] == username and u['password'] == password), None)
        if user:
            print(f">>> Welcome, {user['username']}!")
            return user
        print(">>> ERROR: Invalid credentials.")
        return None
    except Exception as e:
        print(f">>> ERROR: {e}"); return None

def main():
    user_context = authenticate_user()
    if not user_context: return

    try:
        # 1. Database Connection & Query
        prefix = config.COUNTY_SERVERS.get(user_context['county'])
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={prefix}{config.SERVER_SUFFIX};"
            f"DATABASE={config.DB_NAME};Authentication=ActiveDirectoryInteractive;UID={config.DB_USER};"
        )
        
        query = Path("sale.sql").read_text(encoding="utf-8")
        
        print(f"\n>>> Connecting to {user_context['county']} server...")
        with pyodbc.connect(conn_str) as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, user_context['jurisdiction'])
                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]

        # 2. Save Data & Session Context
        Path("output.json").write_text(json.dumps(results, indent=4, default=str))
        
        session_info = {
            "username": user_context['username'],
            "county": user_context['county'],
            "jurisdiction": user_context['jurisdiction']
        }
        Path("session.json").write_text(json.dumps(session_info))

        # 3. Launch the View Server
        print(">>> Launching Dashboard...")
        webbrowser.open("http://localhost:8000")
        
        # This calls your separate view_server.py logic
        os.system("python view_server.py")

    except Exception as e:
        print(f">>> CRITICAL ERROR: {e}")

if __name__ == "__main__":
    main()
