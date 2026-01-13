from flask import Blueprint, request, jsonify
from db import get_db_connection
from extensions import bcrypt

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify(success=False, message="No data received"), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify(success=False, message="Email and password required"), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT password, role FROM users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()

        cur.close()
        conn.close()

        if user and bcrypt.check_password_hash(user[0], password):
            return jsonify(success=True, role=user[1])

        return jsonify(success=False, message="Invalid credentials"), 401

    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify(success=False, message="Server error"), 500
