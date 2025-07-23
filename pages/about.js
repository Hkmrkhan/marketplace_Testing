import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <h1>About Car Marketplace</h1>
        <p>This is a platform to buy and sell cars easily. Built with Next.js.</p>
      </main>
      <Footer />
    </div>
  );
}
