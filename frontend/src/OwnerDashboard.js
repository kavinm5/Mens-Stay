import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/OwnerDashboard.css";
import "./styles/BuildingMap.css";

function OwnerDashboard() {
  const navigate = useNavigate();

  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [members, setMembers] = useState([]);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");

  const [message, setMessage] = useState("");

  /* VIEW CONTROL */
  const [viewLevel, setViewLevel] = useState("building");

  /* MASTER INPUTS */
  const [newBuildingName, setNewBuildingName] = useState("");
  const [floorName, setFloorName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [memberCode, setMemberCode] = useState("");

  /* MODALS */
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBedModal, setShowBedModal] = useState(false);

  /* OCCUPIED BED MODAL */
  const [showOccupiedModal, setShowOccupiedModal] = useState(false);
  const [occupiedDetails, setOccupiedDetails] = useState(null);

  /* PAST GUESTS */
  const [pastGuests, setPastGuests] = useState([]);

  /* ---------------- LOADERS ---------------- */

  const loadBuildings = async () => {
    const res = await fetch("http://127.0.0.1:5000/buildings");
    setBuildings(await res.json());
  };

  const loadFloors = async (buildingId) => {
    const res = await fetch(`http://127.0.0.1:5000/floors/${buildingId}`);
    setFloors(await res.json());
  };

  const loadRooms = async (floorId) => {
    const res = await fetch(`http://127.0.0.1:5000/rooms/${floorId}`);
    setRooms(await res.json());
  };

  const loadMembers = async (roomId) => {
    const res = await fetch(`http://127.0.0.1:5000/room-members/${roomId}`);
    setMembers(await res.json());
  };

  const loadOccupiedDetails = async (memberId) => {
    const res = await fetch(`http://127.0.0.1:5000/occupied-bed/${memberId}`);
    const data = await res.json();
    if (data.success) {
      setOccupiedDetails(data);
      setShowOccupiedModal(true);
    }
  };

  const loadPastGuests = async () => {
    const res = await fetch("http://127.0.0.1:5000/past-guests");
    setPastGuests(await res.json());
  };

  useEffect(() => {
    loadBuildings();
    loadPastGuests();
  }, []);

  /* ---------------- ADD ACTIONS ---------------- */

  const addBuilding = async () => {
    await fetch("http://127.0.0.1:5000/buildings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newBuildingName }),
    });
    setNewBuildingName("");
    setShowBuildingModal(false);
    loadBuildings();
  };

  const addFloor = async () => {
    await fetch("http://127.0.0.1:5000/floors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        building_id: selectedBuilding.id,
        name: floorName,
      }),
    });
    setFloorName("");
    setShowFloorModal(false);
    loadFloors(selectedBuilding.id);
  };

  const addRoom = async () => {
    await fetch("http://127.0.0.1:5000/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        floor_id: selectedFloor.id,
        room_code: roomCode,
      }),
    });
    setRoomCode("");
    setShowRoomModal(false);
    loadRooms(selectedFloor.id);
  };

  const addMember = async () => {
    await fetch("http://127.0.0.1:5000/room-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: selectedRoom.id,
        member_code: memberCode,
      }),
    });
    setMemberCode("");
    setShowBedModal(false);
    loadMembers(selectedRoom.id);
  };

  /* ---------------- CREATE GUEST ---------------- */

  const createGuestWithBed = async () => {
    const res = await fetch("http://127.0.0.1:5000/create-guest-with-bed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: guestName,
        email: guestEmail,
        password: guestPassword,
        member_id: selectedMember.id,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setMessage("Guest created & bed assigned ✅");
      setSelectedMember(null);
      setGuestName("");
      setGuestEmail("");
      setGuestPassword("");
      loadMembers(selectedRoom.id);
    } else {
      setMessage(data.message || "Failed");
    }
  };

  /* ---------------- CHECKOUT ---------------- */

  const checkoutGuest = async () => {
    await fetch("http://127.0.0.1:5000/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: occupiedDetails.member_id,
        guest_id: occupiedDetails.guest_id,
      }),
    });

    setShowOccupiedModal(false);
    setOccupiedDetails(null);
    loadMembers(selectedRoom.id);
    loadPastGuests();
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="owner-container">
      <div className="owner-card">
        <h2>Owner Dashboard</h2>

        {viewLevel !== "building" && (
          <button
            onClick={() => {
              if (viewLevel === "floor") setViewLevel("building");
              if (viewLevel === "room") setViewLevel("floor");
              if (viewLevel === "bed") setViewLevel("room");
            }}
          >
            ← Back
          </button>
        )}

        {/* BUILDINGS */}
        {viewLevel === "building" && (
          <>
            <h3>Select Building</h3>
            <div className="bed-grid">
              {buildings.map((b) => (
                <div
                  key={b.id}
                  className="bed empty"
                  onClick={() => {
                    setSelectedBuilding(b);
                    setViewLevel("floor");
                    loadFloors(b.id);
                  }}
                >
                  {b.name}
                </div>
              ))}
              <div className="bed empty" onClick={() => setShowBuildingModal(true)}>
                + Add
              </div>
            </div>
          </>
        )}

        {/* FLOORS */}
        {viewLevel === "floor" && selectedBuilding && (
          <>
            <h3>Floors – {selectedBuilding.name}</h3>
            <div className="bed-grid">
              {floors.map((f) => (
                <div
                  key={f.id}
                  className="bed empty"
                  onClick={() => {
                    setSelectedFloor(f);
                    setViewLevel("room");
                    loadRooms(f.id);
                  }}
                >
                  {f.name}
                </div>
              ))}
              <div className="bed empty" onClick={() => setShowFloorModal(true)}>
                + Add
              </div>
            </div>
          </>
        )}

        {/* ROOMS */}
        {viewLevel === "room" && selectedFloor && (
          <>
            <h3>Rooms – {selectedFloor.name}</h3>
            <div className="bed-grid">
              {rooms.map((r) => (
                <div
                  key={r.id}
                  className="bed empty"
                  onClick={() => {
                    setSelectedRoom(r);
                    setViewLevel("bed");
                    loadMembers(r.id);
                  }}
                >
                  {r.room_code}
                </div>
              ))}
              <div className="bed empty" onClick={() => setShowRoomModal(true)}>
                + Add
              </div>
            </div>
          </>
        )}

        {/* BEDS */}
        {viewLevel === "bed" && selectedRoom && (
          <>
            <h3>Beds – {selectedRoom.room_code}</h3>
            <div className="bed-grid">
              {members.map((m) => (
                <div
                  key={m.id}
                  className={`bed ${m.is_occupied ? "occupied" : "empty"}`}
                  onClick={() =>
                    m.is_occupied
                      ? loadOccupiedDetails(m.id)
                      : setSelectedMember(m)
                  }
                >
                  {m.member_code}
                </div>
              ))}
              <div className="bed empty" onClick={() => setShowBedModal(true)}>
                + Add
              </div>
            </div>
          </>
        )}

        {/* CREATE GUEST */}
        {selectedMember && (
          <div style={{ marginTop: "20px" }}>
            <h3>Create Guest for {selectedMember.member_code}</h3>
            <input placeholder="Guest Name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            <input type="email" placeholder="Guest Email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={guestPassword} onChange={(e) => setGuestPassword(e.target.value)} />
            <button onClick={createGuestWithBed}>Create & Assign</button>
          </div>
        )}

        {/* PAST GUESTS */}
        <h3>Past Guests</h3>
        <ul>
          {pastGuests.map((g) => (
            <li key={g.id}>{g.name} – {g.email}</li>
          ))}
        </ul>

        {message && <p className="owner-message">{message}</p>}

        <button className="owner-logout" onClick={logout}>
          Logout
        </button>
      </div>

      {/* OCCUPIED BED MODAL */}
      {showOccupiedModal && occupiedDetails && (
        <Modal
          title="Occupied Bed Details"
          onClose={() => setShowOccupiedModal(false)}
        >
          <p><b>Name:</b> {occupiedDetails.name}</p>
          <p><b>Email:</b> {occupiedDetails.email}</p>
          <p><b>Bed:</b> {occupiedDetails.member_code}</p>
          <button onClick={checkoutGuest}>Checkout</button>
        </Modal>
      )}

      {/* ADD MODALS */}
      {showBuildingModal && <SimpleModal title="Add Building" value={newBuildingName} setValue={setNewBuildingName} onSave={addBuilding} onClose={() => setShowBuildingModal(false)} />}
      {showFloorModal && <SimpleModal title="Add Floor" value={floorName} setValue={setFloorName} onSave={addFloor} onClose={() => setShowFloorModal(false)} />}
      {showRoomModal && <SimpleModal title="Add Room" value={roomCode} setValue={setRoomCode} onSave={addRoom} onClose={() => setShowRoomModal(false)} />}
      {showBedModal && <SimpleModal title="Add Bed" value={memberCode} setValue={setMemberCode} onSave={addMember} onClose={() => setShowBedModal(false)} />}
    </div>
  );
}

/* SIMPLE MODAL */
function SimpleModal({ title, value, setValue, onSave, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>{title}</h3>
        <input value={value} onChange={(e) => setValue(e.target.value)} />
        <button onClick={onSave}>Save</button>
        <button className="cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/* DETAIL MODAL */
function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>{title}</h3>
        {children}
        <button className="cancel" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default OwnerDashboard;
