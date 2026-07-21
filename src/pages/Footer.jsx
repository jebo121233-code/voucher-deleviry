import "./Footer.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram, faTiktok, faTelegram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* BRAND */}
        <div className="footer-brand">
          <h2>VE<span>Card</span></h2>
          <p>Your best place to buy digital vouchers instantly.</p>
        </div>

        {/* LINKS */}
        <div className="footer-links">
          <h4>Quick Links</h4>
          <a href="#">Home</a>
          <a href="#">Shop</a>
          <a href="#">Deals</a>
          <a href="#">Support</a>
        </div>

        {/* SUPPORT */}
        <div className="footer-links">
          <h4>Support</h4>
          <a href="#">Help Center</a>
          <a href="#">Terms & Conditions</a>
          <a href="#">Privacy Policy</a>
        </div>

        {/* SOCIAL MEDIA */}
        <div className="footer-social">
          <h4>Follow Us</h4>

          <div className="social-icons">
            <a
              href="https://www.facebook.com/share/17xh8WvqXE/"
              className="facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faFacebookF} />
            </a>

            <a
              href="https://www.instagram.com/ve_card1?igsh=MXB6c3MwbWdlYXdhbA=="
              className="instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faInstagram} />
            </a>

            <a
              href="https://www.tiktok.com/@vouchers.ve?_r=1&_t=ZS-94kF7bt768e"
              className="tiktok"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faTiktok} />
            </a>

            <a
              href="https://t.me/+vHW24oO6g582ZTQ0"
              className="telegram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faTelegram} />
            </a>

            <a
              href="https://wa.me/201025311724"
              className="whatsapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faWhatsapp} />
            </a>
          </div>
        </div>

      </div>

      {/* COPYRIGHT */}
      <div className="footer-bottom">
        © {new Date().getFullYear()} VoucherStore. All rights reserved.
      </div>
    </footer>
  );
}
