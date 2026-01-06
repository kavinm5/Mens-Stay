import { useEffect, useState } from "react";
import "./styles/BuildingMap.css";

function BuildingMap({ buildingId }) {
  const [floors, setFloors] = useState([]);
  const [roomsByFloor, setRoomsByFloor] = useState({});
  const [membersByRoom, setMembersByRoom] = useState({});

  // Load floors
  useEffect(() => {
    fetch(`http://127.0.0.1:5000/floors/${buildingId}`)
      .then((res) => res.json())
      .then(setFloors);
  }, [buildingId]);

  // Load rooms for each floor
  useEffect(() => {
    floors.forEach((floor) => {
      fetch(`http://127.0.0.1:5000/rooms/${floor.id}`)
        .then((res) => res.json())
        .then((rooms) => {
          setRoomsByFloor((prev) => ({
            ...prev,
            [floor.id]: rooms,
          }));

          rooms.forEach((room) => {
            fetch(`http://127.0.0.1:5000/room-members/${room.id}`)
              .then((res) => res.json())
              .then((members) => {
                setMembersByRoom((prev) => ({
                  ...prev,
                  [room.id]: members,
                }));
              });
          });
        });
    });
  }, [floors]);

  return (
    <div className="map-container">
      {floors.map((floor) => (
        <div key={floor.id} className="floor-block">
          <div className="floor-title">{floor.name}</div>

          {(roomsByFloor[floor.id] || []).map((room) => (
            <div key={room.id} className="room-row">
              <strong>{room.room_code}</strong>

              <div className="bed-grid">
                {(membersByRoom[room.id] || []).map((m) => (
                  <div
                    key={m.id}
                    className={`bed ${
                      m.is_occupied ? "occupied" : "empty"
                    }`}
                  >
                    {m.member_code}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default BuildingMap;
