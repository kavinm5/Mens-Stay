from flask import Blueprint, request, jsonify
import psycopg2
import os
from dotenv import load_dotenv
from extensions import bcrypt   # ✅ CORRECT

load_dotenv()

owner_bp = Blueprint("owner_bp", __name__)


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
        # create guest
        cur.execute("""
            INSERT INTO users (name, email, password, role)
            VALUES (%s, %s, %s, 'guest')
            RETURNING id
        """, (name, email, hashed_password))
        guest_id = cur.fetchone()[0]

        # assign bed
        cur.execute("""
            UPDATE room_members
            SET guest_id = %s, is_occupied = TRUE
            WHERE id = %s
        """, (guest_id, member_id))

        # insert stay record
        cur.execute("""
            INSERT INTO guest_stays (guest_id, member_id, check_in_date)
            VALUES (%s, %s, CURRENT_DATE)
        """, (guest_id, member_id))

        conn.commit()

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
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
    member_id = data["member_id"]

    conn = get_db_connection()
    cur = conn.cursor()

    # fetch stay + rent
    cur.execute("""
        SELECT gs.id, gs.guest_id, gs.check_in_date, COALESCE(rm.monthly_rent, 0)
        FROM guest_stays gs
        JOIN room_members rm ON rm.id = gs.member_id
        WHERE gs.member_id = %s AND gs.check_out_date IS NULL
    """, (member_id,))

    row = cur.fetchone()

    if not row:
        return jsonify({"success": False, "message": "Active stay not found"}), 404

    stay_id, guest_id, check_in, monthly_rent = row

    # calculate days
    cur.execute("SELECT CURRENT_DATE - %s", (check_in,))
    days = cur.fetchone()[0]
    per_day_rent = monthly_rent / 30
    rent_amount = round(days * per_day_rent, 2)

    try:
        # update stay
        cur.execute("""
            UPDATE guest_stays
            SET check_out_date = CURRENT_DATE,
                total_days = %s,
                rent_amount = %s,
                total_amount = rent_amount + eb_amount
            WHERE id = %s
        """, (days, rent_amount, stay_id))

        # free bed
        cur.execute("""
            UPDATE room_members
            SET guest_id = NULL, is_occupied = FALSE
            WHERE id = %s
        """, (member_id,))

        conn.commit()

    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 400
    finally:
        cur.close()
        conn.close()

    return jsonify({
        "success": True,
        "days": days,
        "rent": rent_amount
    })


@owner_bp.route("/add-eb-bill", methods=["POST"])
def add_eb_bill():
    data = request.get_json()
    room_id = data["room_id"]
    amount = data["amount"]

    conn = get_db_connection()
    cur = conn.cursor()

    # count active beds
    cur.execute("""
        SELECT COUNT(*) FROM room_members
        WHERE room_id = %s AND is_occupied = TRUE
    """, (room_id,))
    count = cur.fetchone()[0]

    if count == 0:
        return jsonify({"success": False, "message": "No active guests"}), 400

    split_amount = round(amount / count, 2)

    # add EB to each active stay
    cur.execute("""
        UPDATE guest_stays
        SET eb_amount = eb_amount + %s,
            total_amount = total_amount + %s
        WHERE member_id IN (
            SELECT id FROM room_members
            WHERE room_id = %s AND is_occupied = TRUE
        )
    """, (split_amount, split_amount, room_id))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"success": True})


@owner_bp.route("/past-guests", methods=["GET"])
def past_guests():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT u.name, u.email,
               gs.check_in_date, gs.check_out_date,
               gs.total_days, gs.total_amount
        FROM guest_stays gs
        JOIN users u ON u.id = gs.guest_id
        WHERE gs.check_out_date IS NOT NULL
        ORDER BY gs.check_out_date DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {
            "name": r[0],
            "email": r[1],
            "check_in": r[2],
            "check_out": r[3],
            "days": r[4],
            "total_paid": r[5]
        } for r in rows
    ])


@owner_bp.route("/tickets", methods=["GET"])
def get_tickets():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT t.id, u.name, t.subject, t.status, t.created_at
        FROM tickets t
        JOIN users u ON u.id = t.guest_id
        ORDER BY t.created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {
            "id": r[0],
            "guest": r[1],
            "subject": r[2],
            "status": r[3],
            "date": r[4]
        } for r in rows
    ])

@owner_bp.route("/active-beds", methods=["GET"])
def active_beds():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            rm.id AS member_id,
            rm.member_code AS bed_code,
            r.room_code,
            f.name AS floor,
            b.name AS building,
            u.id AS guest_id,
            u.name,
            u.email,
            gs.check_in_date,
            (CURRENT_DATE - gs.check_in_date) AS days,
            ROUND((CURRENT_DATE - gs.check_in_date) * (rm.monthly_rent / 30.0), 2) AS amount
        FROM room_members rm
        JOIN guest_stays gs 
            ON gs.member_id = rm.id
           AND gs.check_out_date IS NULL
        JOIN users u ON u.id = gs.guest_id
        JOIN rooms r ON r.id = rm.room_id
        JOIN floors f ON f.id = r.floor_id
        JOIN buildings b ON b.id = f.building_id
        WHERE rm.is_occupied = TRUE
        ORDER BY b.name, f.name, r.room_code, rm.member_code
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {
            "member_id": r[0],
            "bed_code": r[1],
            "room_code": r[2],
            "floor": r[3],
            "building": r[4],
            "guest_id": r[5],
            "name": r[6],
            "email": r[7],
            "check_in": str(r[8]),
            "days": r[9],
            "amount": r[10]
        } for r in rows
    ])




