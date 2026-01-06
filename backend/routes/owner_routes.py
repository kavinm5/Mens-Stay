from flask import Blueprint, request, jsonify
import psycopg2
import os
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt

load_dotenv()

# ✅ Blueprint
owner_bp = Blueprint("owner_bp", __name__)

# ✅ Bcrypt instance
bcrypt = Bcrypt()

# ✅ DB connection helper (MISSING BEFORE)
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=5432
    )

# ---------------- CREATE GUEST + ASSIGN BED ----------------
@owner_bp.route("/create-guest-with-bed", methods=["POST"])
def create_guest_with_bed():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    member_id = data.get("member_id")

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            INSERT INTO users (name, email, password, role, is_active)
            VALUES (%s, %s, %s, 'guest', TRUE)
            RETURNING id
            """,
            (name, email, hashed_password)
        )

        guest_id = cur.fetchone()[0]

        cur.execute(
            """
            UPDATE room_members
            SET guest_id=%s, is_occupied=TRUE
            WHERE id=%s
            """,
            (guest_id, member_id)
        )

        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": "Email already exists"}), 400
    finally:
        cur.close()
        conn.close()

    return jsonify({"success": True})


# ---------------- BUILDINGS ----------------
@owner_bp.route("/buildings", methods=["POST"])
def add_building():
    data = request.get_json()
    name = data.get("name")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO buildings (name) VALUES (%s) RETURNING id",
        (name,)
    )

    building_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify(success=True, id=building_id, name=name)


@owner_bp.route("/buildings", methods=["GET"])
def get_buildings():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, name FROM buildings ORDER BY id")
    rows = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify([{"id": r[0], "name": r[1]} for r in rows])


# ---------------- FLOORS ----------------
@owner_bp.route("/floors", methods=["POST"])
def add_floor():
    data = request.get_json()

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO floors (building_id, name) VALUES (%s, %s) RETURNING id",
        (data.get("building_id"), data.get("name"))
    )

    floor_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify(success=True, id=floor_id)


@owner_bp.route("/floors/<int:building_id>", methods=["GET"])
def get_floors(building_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, name FROM floors WHERE building_id=%s ORDER BY id",
        (building_id,)
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([{"id": r[0], "name": r[1]} for r in rows])


# ---------------- ROOMS ----------------
@owner_bp.route("/rooms", methods=["POST"])
def add_room():
    data = request.get_json()

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO rooms (floor_id, room_code) VALUES (%s, %s) RETURNING id",
        (data.get("floor_id"), data.get("room_code"))
    )

    room_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify(success=True, id=room_id)


@owner_bp.route("/rooms/<int:floor_id>", methods=["GET"])
def get_rooms(floor_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, room_code FROM rooms WHERE floor_id=%s ORDER BY id",
        (floor_id,)
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([{"id": r[0], "room_code": r[1]} for r in rows])


# ---------------- BEDS ----------------
@owner_bp.route("/room-members", methods=["POST"])
def add_room_member():
    data = request.get_json()

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO room_members (room_id, member_code)
        VALUES (%s, %s)
        RETURNING id
        """,
        (data.get("room_id"), data.get("member_code"))
    )

    member_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify(success=True, id=member_id)


@owner_bp.route("/room-members/<int:room_id>", methods=["GET"])
def get_room_members(room_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, member_code, is_occupied FROM room_members WHERE room_id=%s",
        (room_id,)
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {"id": r[0], "member_code": r[1], "is_occupied": r[2]}
        for r in rows
    ])


# ---------------- OCCUPIED BED DETAILS ----------------
@owner_bp.route("/occupied-bed/<int:member_id>", methods=["GET"])
def get_occupied_bed_details(member_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            u.id, u.name, u.email,
            b.name, f.name, r.room_code, rm.member_code
        FROM room_members rm
        JOIN users u ON u.id = rm.guest_id
        JOIN rooms r ON r.id = rm.room_id
        JOIN floors f ON f.id = r.floor_id
        JOIN buildings b ON b.id = f.building_id
        WHERE rm.id = %s
    """, (member_id,))

    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"success": False}), 404

    return jsonify({
        "success": True,
        "guest_id": row[0],
        "name": row[1],
        "email": row[2],
        "building": row[3],
        "floor": row[4],
        "room": row[5],
        "bed": row[6],
        "member_id": member_id
    })


# ---------------- CHECKOUT ----------------
@owner_bp.route("/checkout", methods=["POST"])
def checkout_guest():
    data = request.get_json()
    member_id = data.get("member_id")
    guest_id = data.get("guest_id")

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            UPDATE room_members
            SET guest_id = NULL, is_occupied = FALSE
            WHERE id = %s
        """, (member_id,))

        cur.execute("""
            UPDATE users
            SET is_active = FALSE
            WHERE id = %s
        """, (guest_id,))

        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

    return jsonify({"success": True})
