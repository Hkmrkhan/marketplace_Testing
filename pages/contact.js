import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ContactPage() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        <h1>Contact Us</h1>
        <form>
          <input type="text" placeholder="Your Name" required style={{ display: 'block', marginBottom: 10, width: '100%' }} />
          <input type="email" placeholder="Your Email" required style={{ display: 'block', marginBottom: 10, width: '100%' }} />
          <textarea placeholder="Your Message" required style={{ display: 'block', marginBottom: 10, width: '100%' }} />
          <button type="submit">Send</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
