"""
FOMS AI Service — User Seed Script
Creates and seeds the 'users' table in the foms_ai_db PostgreSQL database.
Run once: python seed_users.py
"""

import psycopg2
import bcrypt
import sys

# ── Config ─────────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 5433,
    "user": "foms_ai",
    "password": "foms_ai_password",
    "dbname": "foms_ai_db"
}

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# ── Users to seed ───────────────────────────────────────────────────────────
# password_version=2 means password already changed (no forced change on login)
USERS = [
    # login_id,  full_name,                           role_name,                        password,        pw_version, must_change
    ("EMP-001",  "Maria Mariel Jane Anonuevo",        "Financial Manager",              "Password@123",  2,          False),
    ("EMP-002",  "Sofia Bea Reyes",                   "Head Accountant",                "Password@123",  2,          False),
    ("EMP-003",  "Ana Cruz",                          "Accountant",                     "Password@123",  2,          False),
    ("EMP-004",  "Juan dela Cruz",                    "Coordinator",                    "Password@123",  2,          False),
    ("EMP-005",  "Pedro Santos",                      "Assistant of Financial Manager", "Password@123",  2,          False),
    ("EMP-006",  "Rosa Reyes",                        "Accountant",                     "Password@123",  2,          False),
    ("EMP-007",  "Carlos Garcia",                     "Coordinator",                    "Password@123",  2,          False),
    # Client accounts
    ("CA-001",   "Lazada Philippines",                "Client",                         "Password@123",  2,          False),
    ("CA-002",   "Shopee Philippines",                "Client",                         "Password@123",  2,          False),
    ("CA-003",   "TikTok Shop Philippines",           "Client",                         "Password@123",  2,          False),
]

def main():
    print("Connecting to foms_ai_db at 127.0.0.1:5433...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected!")
    except Exception as e:
        print(f"ERROR: Cannot connect to database: {e}")
        sys.exit(1)

    # ── Create users table ───────────────────────────────────────────────────
    print("Creating 'users' table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id                  SERIAL PRIMARY KEY,
            login_id            VARCHAR(50)  UNIQUE NOT NULL,
            full_name           VARCHAR(255) NOT NULL,
            role_name           VARCHAR(100) NOT NULL,
            email               VARCHAR(255),
            password_hash       TEXT         NOT NULL,
            password_version    INTEGER      NOT NULL DEFAULT 2,
            must_change_password BOOLEAN     NOT NULL DEFAULT FALSE,
            is_temporary_password BOOLEAN    NOT NULL DEFAULT FALSE,
            password_changed_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
            is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
            created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("Table created (or already exists).")

    # ── Seed users ───────────────────────────────────────────────────────────
    print("\nSeeding users...")
    inserted = 0
    skipped = 0

    for login_id, full_name, role_name, password, pw_version, must_change in USERS:
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE login_id = %s", (login_id,))
        existing = cur.fetchone()

        if existing:
            print(f"  SKIP: {login_id} ({full_name}) — already exists")
            skipped += 1
            continue

        pw_hash = hash_password(password)
        cur.execute("""
            INSERT INTO users (login_id, full_name, role_name, password_hash, password_version, must_change_password)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (login_id, full_name, role_name, pw_hash, pw_version, must_change))

        print(f"  [OK] Inserted: {login_id} ({full_name}) - Role: {role_name}")

        inserted += 1

    # ── Verify ───────────────────────────────────────────────────────────────
    cur.execute("SELECT login_id, full_name, role_name, password_version FROM users ORDER BY login_id;")
    rows = cur.fetchall()

    print(f"\n{'='*60}")
    print(f"SEED COMPLETE: {inserted} inserted, {skipped} skipped")
    print(f"{'='*60}")
    print(f"\nAll users in 'users' table:")
    for row in rows:
        print(f"  {row[0]:<12} | {row[1]:<35} | {row[2]:<35} | v{row[3]}")

    cur.close()
    conn.close()
    print("\nDone! You can now log in to the AI Frontend with:")
    print("  Employee ID: EMP-001")
    print("  Password:    Password@123")

if __name__ == "__main__":
    main()
