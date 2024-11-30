import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import Loader from "./Loader";
import "../styles/Eventos.css";

const Eventos = () => {
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const [pastEvents, setPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState({}); // Estado para calificaciones independientes

  useEffect(() => {
    const fetchEventos = async () => {
      setIsLoading(true);
      const eventosDb = collection(db, "eventos");

      try {
        // Ordenamos por ID en orden descendente para tener el evento más reciente al principio
        const eventosQuery = query(eventosDb, orderBy("id", "desc"));
        const eventosResp = await getDocs(eventosQuery);

        const eventos = eventosResp.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        // Verificar si hay eventos y asignarlos correctamente
        if (eventos.length > 0) {
          setUpcomingEvent(eventos[0]); // El primero es el evento más reciente
          setPastEvents(eventos.slice(1)); // El resto va a "Past events"
        }
      } catch (error) {
        console.error("Error fetching eventos: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventos();
  }, []);

  // Función para manejar la calificación de estrellas para cada evento
  const handleRatingChange = (eventoId, rating) => {
    setRatings((prevRatings) => ({
      ...prevRatings,
      [`${eventoId}`]: rating,
    }));
  };

  if (isLoading) return <Loader />;

  return (
    <>
      <div className="eventosContainer">
        <h2 className="eventosTitle">Upcoming events</h2>
        {upcomingEvent && (
          <div className="eventoCard">
            <div className="imgEventosContainer">
              <a href="#">{/* Re direccion a ticketera */}
                <img src={upcomingEvent.image} alt="" />
              </a>
            </div>
          </div>
        )}
      </div>
      <h2 className="pastEventosTitle">Past events</h2>
      <div className="pastEventosContainer">
        {pastEvents.map((evento) => (
          <div key={evento.id} className="pastEventoCard">
            <div className="pastImgEventos">
              <img src={evento.image} alt="" />
              <div className="EventoRating">
                {[5, 4, 3, 2, 1].map((value) => (
                  <React.Fragment key={value}>
                    <input
                      type="radio"
                      id={`star${value}-${evento.id}`}
                      name={`rating-${evento.id}`}
                      value={value}
                      checked={ratings[`${evento.id}`] === value}
                      onChange={() => handleRatingChange(evento.id, value)}
                    />
                    <label htmlFor={`star${value}-${evento.id}`} />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Eventos;
