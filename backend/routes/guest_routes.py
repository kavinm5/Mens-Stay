from flask import Blueprint, jsonify, request
from db import get_db_connection

guest_bp = Blueprint("guest", __name__)

# ---------------- GUEST DASHBOARD ----------------
@guest_bp.route("/guest/dashboard", methods=["GET"])
def guest_dashboard():
    """
    Expects: email as query param
    Example: /guest/dashboard?email=test@gmail.com
    """

    email = request.args.get("email")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT 
            u.name,
            u.email,
            b.name AS building,
            f.name AS floor,
            r.room_code,
            rm.member_code
        FROM users u
        LEFT JOIN room_members rm ON rm.guest_id = u.id
        LEFT JOIN rooms r ON r.id = rm.room_id
        LEFT JOIN floors f ON f.id = r.floor_id
        LEFT JOIN buildings b ON b.id = f.building_id
        WHERE u.email = %s AND u.role = 'guest'
        """,
        (email,)
    )

    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"success": False, "message": "Guest not found"}), 404

    return jsonify({
        "success": True,
        "name": row[0],
        "email": row[1],
        "building": row[2],
        "floor": row[3],
        "room": row[4],
        "bed": row[5],
    })
