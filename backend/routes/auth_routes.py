from flask import Blueprint, request, jsonify
from db import get_db_connection
from extensions import bcrypt

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT password, role FROM users WHERE email=%s",
        (email,)
    )
    user = cur.fetchone()

    cur.close()
    conn.close()

    if user and bcrypt.check_password_hash(user[0], password):
        return jsonify(success=True, role=user[1])
    else:
        return jsonify(success=False), 401
