import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/OwnerDashboard.css";
import "./styles/BuildingMap.css";

function OwnerDashboard() {
  const navigate = useNavigate();

  /* ================= SIDEBAR ================= */
  const [activeMenu, setActiveMenu] = useState("dashboard");

  /* ================= DATA ================= */
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [members, setMembers] = useState([]);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  /* ================= GUEST FORM ================= */
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");

  /* ===== DASHBOARD SUMMARY ===== */
  const [totalBeds, setTotalBeds] = useState(0);
  const [occupiedBeds, setOccupiedBeds] = useState(0);
  const [emptyBeds, setEmptyBeds] = useState(0);

  const [showAvailability, setShowAvailability] = useState(false);
  const [showOccupied, setShowOccupied] = useState(false);

  const [availabilityData, setAvailabilityData] = useState([]);
  const [occupiedData, setOccupiedData] = useState([]);

  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [modalBuilding, setModalBuilding] = useState(null);
  const [modalRoom, setModalRoom] = useState(null);

  const [selectedFilterBuilding, setSelectedFilterBuilding] = useState("");


  /* ACTIVE BEDS */
  const [activeBeds, setActiveBeds] = useState([]);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [activeBedDetails, setActiveBedDetails] = useState(null);

  /* PROPERTY SETUP STATES */
  const [newBuilding, setNewBuilding] = useState("");
  const [newFloor, setNewFloor] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newBed, setNewBed] = useState("");

  const [setupBuildingId, setSetupBuildingId] = useState(null);
  const [setupFloorId, setSetupFloorId] = useState(null);
  const [setupRoomId, setSetupRoomId] = useState(null);





  /* ================= LOADERS ================= */
  const getFilteredBuildings = () => {
    if (!selectedFilterBuilding) return buildings;
    return buildings.filter(
      (b) => b.name === selectedFilterBuilding
    );
  };

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

  const loadActiveBeds = async () => {
    const res = await fetch("http://127.0.0.1:5000/active-beds");
    const data = await res.json();
    setActiveBeds(data);
  };

  const addBuilding = async () => {
    await fetch("http://127.0.0.1:5000/buildings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newBuilding })
    });
    setNewBuilding("");
    loadBuildings();
  };

  const addFloor = async () => {
    await fetch("http://127.0.0.1:5000/floors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        building_id: setupBuildingId,
        name: newFloor
      })
    });
    setNewFloor("");
    loadFloors(setupBuildingId);
  };

  const addRoom = async () => {
    await fetch("http://127.0.0.1:5000/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        floor_id: setupFloorId,
        room_code: newRoom
      })
    });
    setNewRoom("");
    loadRooms(setupFloorId);
  };

  const addBed = async () => {
    await fetch("http://127.0.0.1:5000/room-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: setupRoomId,
        member_code: newBed
      })
    });
    setNewBed("");
    loadMembers(setupRoomId);
  };

  const calculateDashboardStats = async () => {
    let total = 0;
    let occupied = 0;

    const filteredBuildings = getFilteredBuildings();

    for (const building of filteredBuildings) {
      const floorsRes = await fetch(`http://127.0.0.1:5000/floors/${building.id}`);
      const floorsData = await floorsRes.json();

      for (const floor of floorsData) {
        const roomsRes = await fetch(`http://127.0.0.1:5000/rooms/${floor.id}`);
        const roomsData = await roomsRes.json();

        for (const room of roomsData) {
          const bedsRes = await fetch(
            `http://127.0.0.1:5000/room-members/${room.id}`
          );
          const bedsData = await bedsRes.json();

          total += bedsData.length;
          occupied += bedsData.filter(b => b.is_occupied).length;
        }
      }
    }

    setTotalBeds(total);
    setOccupiedBeds(occupied);
    setEmptyBeds(total - occupied);
  };


  const calculateOccupied = async () => {
    const result = [];
    const filteredBuildings = getFilteredBuildings();

    for (const building of filteredBuildings) {
      const floorsRes = await fetch(`http://127.0.0.1:5000/floors/${building.id}`);
      const floorsData = await floorsRes.json();

      for (const floor of floorsData) {
        const roomsRes = await fetch(`http://127.0.0.1:5000/rooms/${floor.id}`);
        const roomsData = await roomsRes.json();

        for (const room of roomsData) {
          const bedsRes = await fetch(
            `http://127.0.0.1:5000/room-members/${room.id}`
          );
          const bedsData = await bedsRes.json();

          const occupied = bedsData.filter(b => b.is_occupied);

          if (occupied.length > 0) {
            result.push({
              building: building.name,
              room: room.room_code,
              occupied: occupied.length,
              members: occupied
            });
          }
        }
      }
    }

    setOccupiedData(result);
  };

  const calculateAvailability = async () => {
    try {
      const result = [];
      const filteredBuildings = getFilteredBuildings();

      for (const building of filteredBuildings) {
        const floorsRes = await fetch(`http://127.0.0.1:5000/floors/${building.id}`);
        if (!floorsRes.ok) continue;
        const floorsData = await floorsRes.json();

        for (const floor of floorsData) {
          const roomsRes = await fetch(`http://127.0.0.1:5000/rooms/${floor.id}`);
          if (!roomsRes.ok) continue;
          const roomsData = await roomsRes.json();

          for (const room of roomsData) {
            const bedsRes = await fetch(
              `http://127.0.0.1:5000/room-members/${room.id}`
            );
            if (!bedsRes.ok) continue;
            const bedsData = await bedsRes.json();

            const total = bedsData.length;
            const occupied = bedsData.filter(b => b.is_occupied).length;

            result.push({
              building: building.name,
              floor: floor.name,      // ✅ ADD FLOOR
              room: room.room_code,
              total,
              occupied,
              empty: total - occupied
            });
          }
        }
      }

      setAvailabilityData(result);
    } catch (err) {
      console.error(err);
      alert("Backend not reachable");
    }
  };



  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    if (buildings.length > 0) {
      calculateDashboardStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings]);


  useEffect(() => {
    if (activeMenu === "activeBeds") {
      loadActiveBeds();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (buildings.length > 0) {
      calculateDashboardStats();

      if (showOccupied) calculateOccupied();
      if (showAvailability) calculateAvailability();
    }
    // eslint-disable-next-line
  }, [selectedFilterBuilding]);


  /* ================= CREATE GUEST ================= */
  const createGuestWithBed = async () => {
    if (!selectedMember) return;

    await fetch("http://127.0.0.1:5000/create-guest-with-bed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: guestName,
        email: guestEmail,
        password: guestPassword,
        member_id: selectedMember.id,
      }),
    });

    // Reset
    setGuestName("");
    setGuestEmail("");
    setGuestPassword("");
    setSelectedMember(null);

    loadMembers(selectedRoom.id);
    alert("Guest created successfully");
  };


  const checkoutGuest = async () => {
    if (!activeBedDetails) return;

    await fetch("http://127.0.0.1:5000/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: activeBedDetails.member_id
      })
    });

    setActiveBedDetails(null);
    loadActiveBeds();
    alert("Guest checked out successfully");
  };


  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  /* ================= UI ================= */
  return (
    <div className="dashboard-layout">
      {/* ========== SIDEBAR ========== */}
      <aside className="sidebar">
        <h2 className="logo">Mens Stay</h2>

        {[
          ["dashboard", "Dashboard"],
          ["addGuest", "Add Guest"],
          ["property", "Property Setup"],
          ["activeBeds", "Active Beds"],
          ["billing", "Billing"],
          ["pastGuests", "Past Guests"],
          ["tickets", "Tickets"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={activeMenu === key ? "active" : ""}
            onClick={() => {
              setActiveMenu(key);
              setSelectedBuilding(null);
              setSelectedFloor(null);
              setSelectedRoom(null);
              setSelectedMember(null)
              setActiveBedDetails(null);
            }}
          >
            {label}
          </button>
        ))}

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main className="main-content">


        {/* ===== DASHBOARD ===== */}
        {activeMenu === "dashboard" && (
          <>
            <h2>Active Overview</h2>

            {/* ===== SUMMARY CARDS ===== */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              <div className="summary-card">
                <h4>Total Beds</h4>
                <p>{totalBeds}</p>
              </div>

              <div className="summary-card occupied">
                <h4>Occupied</h4>
                <p>{occupiedBeds}</p>

                <button
                  className="availability-btn"
                  onClick={async () => {
                    if (!showOccupied) {
                      await calculateOccupied();
                    }
                    setShowOccupied(!showOccupied);
                    setShowAvailability(false);
                  }}
                >
                  {showOccupied ? "Hide Occupied" : "View Occupied"}
                </button>
              </div>

              <div className="summary-card empty">
                <h4>Empty</h4>
                <p>{emptyBeds}</p>

                <button
                  className="availability-btn"
                  onClick={async () => {
                    if (!showAvailability) {
                      await calculateAvailability();
                    }
                    setShowAvailability(!showAvailability);
                    setShowOccupied(false);
                  }}
                >
                  {showAvailability ? "Hide Availability" : "View Availability"}
                </button>
              </div>
            </div>

            {/* ===== BUILDING FILTER ===== */}
            {(showAvailability || showOccupied) && (
              <div style={{ marginBottom: 16 }}>
                <select
                  value={selectedFilterBuilding}
                  onChange={(e) => setSelectedFilterBuilding(e.target.value)}
                >
                  <option value="">All Buildings</option>
                  {[...new Set(
                    (showAvailability ? availabilityData : occupiedData).map(
                      (d) => d.building
                    )
                  )].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ===== OCCUPIED PANEL ===== */}
            {showOccupied && (
              <div className="availability-panel">
                <h3>Room-wise Occupied Beds</h3>

                {occupiedData
                  .filter(
                    (o) =>
                      !selectedFilterBuilding ||
                      o.building === selectedFilterBuilding
                  )
                  .map((o, i) => (
                    <div key={i} className="availability-row">
                      <b>{o.building}</b> — Room {o.room}
                      <span style={{ marginLeft: 8, color: "#dc2626" }}>
                        {o.occupied} Occupied
                      </span>

                      <button
                        style={{ marginLeft: 12 }}
                        onClick={() => setActiveMenu("activeBeds")}
                      >
                        View Guests
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* ===== AVAILABILITY PANEL ===== */}
            {showAvailability && (
              <div className="availability-panel">
                <h3>Room-wise Bed Availability</h3>

                {/* ===== AVAILABILITY ROWS ===== */}
                {availabilityData
                  .filter(
                    (a) =>
                      !selectedFilterBuilding ||
                      a.building === selectedFilterBuilding
                  )
                  .map((a, i) => (
                    <div key={i} className="availability-row">
                      <div className="col-building">{a.building}</div>
                      <div className="col-floor">{a.floor}</div>
                      <div className="col-room">Room {a.room}</div>

                      <div
                        className={`col-status ${a.empty === 0 ? "status-full" : "status-available"
                          }`}
                      >
                        {a.empty}/{a.total} Available
                      </div>

                      <div className="col-action">
                        {a.empty > 0 && (
                          <button
                            onClick={() => {
                              setModalBuilding(a.building);
                              setModalRoom(a.room);
                              setShowAddGuestModal(true);
                            }}
                          >
                            Add Guest
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                {/* ===== ADD GUEST MODAL (ONLY ONCE) ===== */}
                {showAddGuestModal && (
                  <div className="modal-overlay">
                    <div className="modal-card">
                      <h3>Add Guest</h3>

                      <p><b>Building:</b> {modalBuilding}</p>
                      <p><b>Room:</b> {modalRoom}</p>

                      <input
                        placeholder="Guest Name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                      />

                      <input
                        placeholder="Email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                      />

                      <input
                        type="password"
                        placeholder="Password"
                        value={guestPassword}
                        onChange={(e) => setGuestPassword(e.target.value)}
                      />

                      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                        <button onClick={createGuestWithBed}>
                          Create Guest
                        </button>

                        <button
                          style={{ background: "#e5e7eb", color: "#000" }}
                          onClick={() => {
                            setShowAddGuestModal(false);
                            setGuestName("");
                            setGuestEmail("");
                            setGuestPassword("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            </>
            )}

            {/* ===== ADD GUEST (OLD MODEL) ===== */}
            {activeMenu === "addGuest" && (
              <>
                <h2>Add Guest</h2>

                {/* BUILDINGS */}
                <h3>Select Building</h3>
                <div className="bed-grid">
                  {buildings.map((b) => (
                    <div
                      key={b.id}
                      className="bed empty"
                      onClick={() => {
                        setSelectedBuilding(b);
                        setSelectedFloor(null);
                        setSelectedRoom(null);
                        setSelectedMember(null);
                        loadFloors(b.id);
                      }}
                    >
                      {b.name}
                    </div>
                  ))}
                </div>

                {/* FLOORS */}
                {selectedBuilding && (
                  <>
                    <h3>Floors – {selectedBuilding.name}</h3>
                    <div className="bed-grid">
                      {floors.map((f) => (
                        <div
                          key={f.id}
                          className="bed empty"
                          onClick={() => {
                            setSelectedFloor(f);
                            setSelectedRoom(null);
                            setSelectedMember(null);
                            loadRooms(f.id);
                          }}
                        >
                          {f.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ROOMS */}
                {selectedFloor && (
                  <>
                    <h3>Rooms – {selectedFloor.name}</h3>
                    <div className="bed-grid">
                      {rooms.map((r) => (
                        <div
                          key={r.id}
                          className="bed empty"
                          onClick={() => {
                            setSelectedRoom(r);
                            setSelectedMember(null);
                            loadMembers(r.id);
                          }}
                        >
                          {r.room_code}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* EMPTY BEDS */}
                {selectedRoom && (
                  <>
                    <h3>Select Empty Bed</h3>
                    <div className="bed-grid">
                      {members
                        .filter((m) => !m.is_occupied)
                        .map((m) => (
                          <div
                            key={m.id}
                            className={`bed empty ${selectedMember?.id === m.id ? "selected" : ""
                              }`}
                            onClick={() => setSelectedMember(m)}
                          >
                            {m.member_code}
                          </div>
                        ))}
                    </div>
                  </>
                )}

                {/* GUEST FORM */}
                {selectedMember && (
                  <>
                    <h3>Create Guest for {selectedMember.member_code}</h3>
                    <input
                      placeholder="Guest Name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                    <input
                      placeholder="Email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={guestPassword}
                      onChange={(e) => setGuestPassword(e.target.value)}
                    />
                    <button onClick={createGuestWithBed}>
                      Create Guest
                    </button>
                  </>
                )}
              </>
            )}

            {/* PLACEHOLDERS */}
            {activeMenu === "activeBeds" && (
              <>
                <h2>Active Beds</h2>

                <div className="bed-grid">
                  {activeBeds.map((b) => (
                    <div
                      key={b.member_id}
                      className="bed occupied"
                      onClick={() => setActiveBedDetails(b)}
                    >
                      {b.bed_code}
                    </div>
                  ))}
                </div>

                {/* ✅ GUEST DETAILS ONLY HERE */}
                {activeBedDetails && (
                  <div className="guest-details-card">
                    <h3>Guest Details</h3>

                    <p><b>Name:</b> {activeBedDetails.name}</p>
                    <p><b>Email:</b> {activeBedDetails.email}</p>
                    <p><b>Building:</b> {activeBedDetails.building}</p>
                    <p><b>Room:</b> {activeBedDetails.room_code}</p>
                    <p><b>Bed:</b> {activeBedDetails.bed_code}</p>
                    <p><b>Check-in:</b> {activeBedDetails.check_in}</p>
                    <p><b>Days Stayed:</b> {activeBedDetails.days}</p>
                    <p><b>Rent Till Today:</b> ₹{activeBedDetails.amount}</p>

                    <button
                      onClick={checkoutGuest}
                    >
                      Checkout Guest
                    </button>

                    <button
                      onClick={() => setActiveBedDetails(null)}
                    >
                      Close
                    </button>
                  </div>
                )}
              </>
            )}


            {activeMenu === "property" && (
              <>
                <h2>Property Setup</h2>

                {/* ========== ADD BUILDING ========== */}
                <div className="setup-box">
                  <h3>Add Building</h3>
                  <input
                    placeholder="Building Name"
                    value={newBuilding}
                    onChange={(e) => setNewBuilding(e.target.value)}
                  />
                  <button onClick={addBuilding}>Add Building</button>
                </div>

                {/* ========== ADD FLOOR ========== */}
                <div className="setup-box">
                  <h3>Add Floor</h3>

                  <select
                    onChange={(e) => {
                      setSetupBuildingId(e.target.value);
                      loadFloors(e.target.value);
                    }}
                  >

                    <option>Select Building</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>

                  <input
                    placeholder="Floor Name"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                  />

                  <button onClick={addFloor}>Add Floor</button>
                </div>

                {/* ========== ADD ROOM ========== */}
                <div className="setup-box">
                  <h3>Add Room</h3>

                  <select
                    onChange={(e) => {
                      setSetupFloorId(e.target.value);
                      loadRooms(e.target.value);
                    }}
                  >

                    <option>Select Floor</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>

                  <input
                    placeholder="Room Code (ex: S1)"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                  />

                  <button onClick={addRoom}>Add Room</button>
                </div>

                {/* ========== ADD BED ========== */}
                <div className="setup-box">
                  <h3>Add Bed</h3>

                  <select onChange={(e) => setSetupRoomId(e.target.value)}>
                    <option>Select Room</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.room_code}</option>
                    ))}
                  </select>

                  <input
                    placeholder="Bed Code (ex: S1-B1)"
                    value={newBed}
                    onChange={(e) => setNewBed(e.target.value)}
                  />

                  <button onClick={addBed}>Add Bed</button>
                </div>
              </>
            )}



            {activeMenu === "billing" && <h2>Billing (next)</h2>}
            {activeMenu === "pastGuests" && <h2>Past Guests (next)</h2>}
            {activeMenu === "tickets" && <h2>Tickets (next)</h2>}
          </main>
    </div>
  );
}

export default OwnerDashboard;
