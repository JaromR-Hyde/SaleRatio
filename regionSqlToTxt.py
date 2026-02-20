import pyodbc
from pathlib import Path
import config


# ------------------------------------------------------------
# HARD-CODED PATHS
# ------------------------------------------------------------
SQL_FILE_PATH = "region.sql"                     # Your SQL file
OUTPUT_FILE_PATH = "1_Regions/region_landDistrict.txt"   # Your output file


# ------------------------------------------------------------
# FUNCTION: READ SQL FROM FILE
# ------------------------------------------------------------
def load_sql_from_file(path: str) -> str:
    sql_path = Path(path)
    if not sql_path.exists():
        raise FileNotFoundError(f"SQL file not found: {path}")
    return sql_path.read_text(encoding="utf-8")


# ------------------------------------------------------------
# FUNCTION: CONNECT TO SQL SERVER USING config.py
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
# FUNCTION: RUN SQL AND RETURN ROWS
# ------------------------------------------------------------
def run_query(sql: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(sql)

    # If SQL returned no result set
    if cursor.description is None:
        cursor.close()
        conn.close()
        return [], []

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    print(f">>> ROWS RETURNED: {len(rows)}")

    cursor.close()
    conn.close()

    return columns, rows


# ------------------------------------------------------------
# FUNCTION: WRITE OUTPUT TO region_landDistrict.txt
# ------------------------------------------------------------
def write_to_txt(columns, rows, output_path):
    output_file = Path(output_path)

    # Clear the file first
    output_file.write_text("", encoding="utf-8")

    with output_file.open("a", encoding="utf-8") as f:
        # Write header
        f.write("\t".join(columns) + "\n")

        # Write rows
        for row in rows:
            row_str = "\t".join([str(x) if x is not None else "" for x in row])
            f.write(row_str + "\n")

    print(f">>> TXT exported to: {output_file.resolve()}")


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------
if __name__ == "__main__":
    sql_code = load_sql_from_file(SQL_FILE_PATH)
    columns, rows = run_query(sql_code)
    write_to_txt(columns, rows, OUTPUT_FILE_PATH)
