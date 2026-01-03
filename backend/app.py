from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=5432
    )

@app.route("/db-test")
def db_test():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT NOW();")
    time = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify({"db_connected": True, "time": str(time)})

if __name__ == "__main__":
    app.run(debug=True)


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, role FROM users WHERE email=%s AND password=%s",
        (email, password)
    )

    user = cur.fetchone()
    cur.close()
    conn.close()

    if user:
        return jsonify({
            "success": True,
            "user_id": user[0],
            "role": user[1]
        })
    else:
        return jsonify({
            "success": False,
            "message": "Invalid email or password"
        }), 401
