import "../styles/Footer.css";
import visaIcon from "../../media/icons/visa.svg";
import masterIcon from "../../media/icons/mastercard.svg";
import mpIcon from "../../media/icons//mercadopago.svg";


function Footer() {
  return (
    <>
      <section className="footerContainer">
        <p className="footerPayTitle">Pay with</p>
        <div className="footerPaymentContainer">
          <img src={mpIcon} alt="Mercadopago" title="Mercadopago" />
          <img src={masterIcon} alt="MasterCard" title="MasterCard" />
          <img src={visaIcon} alt="visa" title="visa" />
        </div>
        <div className="footer">
          <p className="footerDate">All rights reserved  © 2024 - DCG </p>
        </div>
      </section>
    </>
  );
}

export default Footer;
