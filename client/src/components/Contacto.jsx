import React from "react";
import "../styles/Contacto.css";

function Contacto() {
  return (
    <div className="contactoContainer">
      <h3>Contact</h3>
      <p>contactDCG@gmail.com</p>
      <ul>
        <li>
          <a href="#" target="blank">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-brand-youtube"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="#f4f4f4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" />
              <path d="M10 9l5 3l-5 3z" />
            </svg>
          </a>
        </li>
        <li>
          <a href="#" target="blank">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-brand-meta"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="#f4f4f4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 10.174c1.766 -2.784 3.315 -4.174 4.648 -4.174c2 0 3.263 2.213 4 5.217c.704 2.869 .5 6.783 -2 6.783c-1.114 0 -2.648 -1.565 -4.148 -3.652a27.627 27.627 0 0 1 -2.5 -4.174z" />
              <path d="M12 10.174c-1.766 -2.784 -3.315 -4.174 -4.648 -4.174c-2 0 -3.263 2.213 -4 5.217c-.704 2.869 -.5 6.783 2 6.783c1.114 0 2.648 -1.565 4.148 -3.652c1 -1.391 1.833 -2.783 2.5 -4.174z" />
            </svg>
          </a>
        </li>
        <li>
          <a href="#" target="blank">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-brand-instagram"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="#f4f4f4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
              <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
              <path d="M16.5 7.5l0 .01" />
            </svg>
          </a>
        </li>
      </ul>
    </div>
  );
}

export default Contacto;
