import sqlite3

def list_tables_and_columns(db_path):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    print("Tables and their columns:\n")
    for table_name, in tables:
        print(f"Table: {table_name}")
        
        # Get column info using PRAGMA
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        
        # Columns: cid, name, type, notnull, dflt_value, pk
        for col in columns:
            cid, name, col_type, notnull, dflt_value, pk = col
            print(f"  - Column: {name}")
            print(f"    Type: {col_type}")
            print(f"    Not Null: {bool(notnull)}")
            print(f"    Default Value: {dflt_value}")
            print(f"    Primary Key: {bool(pk)}")
        print()

    conn.close()

if __name__ == "__main__":
    # Replace 'school.db' with your SQLite database file
    list_tables_and_columns("database/main.db")
    