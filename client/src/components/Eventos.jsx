import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import Loader from "./Loader";
import "../styles/Eventos.css";

const Eventos = () => {
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const [pastEvents, setPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEventos = async () => {
      setIsLoading(true);
      const eventosDb = collection(db, "eventos");

      try {
        const eventosQuery = query(eventosDb, orderBy("id", "desc"));
        const eventosResp = await getDocs(eventosQuery);

        const eventos = eventosResp.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        if (eventos.length > 0) {
          setUpcomingEvent(eventos[0]);
          setPastEvents(eventos.slice(1));
        }
      } catch (error) {
        console.error("Error fetching eventos: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventos();
  }, []);

  if (isLoading) return <Loader />;

  return (
    <>
      <div className="eventosContainer">
        <h2 className="eventosTitle">Upcoming events</h2>
        {upcomingEvent && (
          <div className="eventoCard">
            <div className="imgEventosContainer">
              <a href={upcomingEvent.buyLink} target="_blank" rel="noopener noreferrer">
                <img src={upcomingEvent.image} alt="Proximo Evento" />
              </a>
            </div>
          </div>
        )}
      </div>
      <div className="eventosContainer">
        <h2 className="pastEventosTitle">Past events</h2>
        <div className="pastEventosContainer">
          {pastEvents.map((evento) => (
            <div key={evento.id} className="pastEventoCard">
              <div className="pastImgEventos">
                <a href={evento.buyLink} target="_blank" rel="noopener noreferrer">
                  <img src={evento.image} alt="Ultimos eventos" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Eventos;
