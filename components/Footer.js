import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '../styles/Footer.module.css';

export default function Footer({ userType }) {
  return (
    <footer style={{textAlign: 'center', padding: '1.5rem 0', background: '#f8f9fa', color: '#888', fontSize: '1rem', borderTop: '1px solid #e1e5e9', marginTop: '2rem'}}>
      {userType === 'seller' && (
        <div>Seller Dashboard &copy; {new Date().getFullYear()} | Manage your listings and sales</div>
      )}
      {userType === 'buyer' && (
        <div>Buyer Dashboard &copy; {new Date().getFullYear()} | Browse and purchase cars</div>
      )}
      {!userType && (
        <div>Car Marketplace &copy; {new Date().getFullYear()} | All rights reserved</div>
      )}
    </footer>
  );
}
