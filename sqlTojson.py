import pyodbc
import json
from pathlib import Path
import config


# ------------------------------------------------------------
# FUNCTION: READ SQL FROM FILE
# ------------------------------------------------------------
def load_sql_from_file(path: str) -> str:
    sql_path = Path(path)
    if not sql_path.exists():
        raise FileNotFoundError(f"SQL file not found: {path}")
    return sql_path.read_text(encoding="utf-8")


# ------------------------------------------------------------
# FUNCTION: CONNECT TO SQL SERVER
# ------------------------------------------------------------
def get_connection():
    try:
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={config.DB_SERVER};"
            f"DATABASE={config.DB_NAME};"
            f"UID={config.DB_USER};"
            f"PWD={config.DB_PASSWORD};"
        )
        print(">>> SUCCESS: Connected to SQL Server")
        return conn

    except Exception as e:
        print(">>> ERROR: Failed to connect to SQL Server")
        print(">>> DETAILS:", e)
        raise


# ------------------------------------------------------------
# FUNCTION: RUN QUERY AND RETURN JSON
# ------------------------------------------------------------
def run_query_to_json(sql: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(sql)

    # If SQL returned no result set
    if cursor.description is None:
        cursor.close()
        conn.close()
        return {"error": "SQL executed successfully but returned no result set"}

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    print(f">>> ROWS RETURNED: {len(rows)}")

    results = [dict(zip(columns, row)) for row in rows]

    cursor.close()
    conn.close()

    return results


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------
if __name__ == "__main__":
    # -----------------------------------------
    # Ask user for SQL file path
    # -----------------------------------------
    sql_path = input("Enter path to SQL file: ").strip()

    sql_code = load_sql_from_file(sql_path)
    results = run_query_to_json(sql_code)

    # -----------------------------------------
    # Export JSON to file
    # -----------------------------------------
    output_path = Path("output.json")
    output_path.write_text(json.dumps(results, indent=4, default=str), encoding="utf-8")

    print(f">>> JSON exported to: {output_path.resolve()}")
