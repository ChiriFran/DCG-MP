import React from 'react';
import HomeNavLinks from './HomeNavLinks';
import Newsletter from './Newsletter';
import PopUpNewsletter from './PopUpNewsletter';
import Contacto from './Contacto';
import '../styles/ContactFooter.css'

const ContactFooter = () => {
  return (
    <div className="linksContainer">
      <div className="links">
        <HomeNavLinks />
        <Newsletter />
        <PopUpNewsletter />
        <Contacto />
      </div>
    </div>
  );
};

export default ContactFooter;
