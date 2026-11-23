# Luxury Car Marketplace Platform

A high-performance automotive marketplace web application engineered with **Next.js 15**, **React 19**, **Supabase**, **Tailwind CSS**, and **Stripe**. The platform connects vehicle buyers and verified sellers through a modern glassmorphic interface, real-time messaging, escrow-ready payment workflows, and cinematic GPU-accelerated motion design.

---

## 🛠️ Tech Stack

- **Frontend Framework:** Next.js 15 (Pages Router) & React 19
- **Styling & UI:** Tailwind CSS 3.4, Glassmorphism Design System, CSS Keyframes
- **Motion & Graphics:** Handcrafted Inline SVG, 60fps GPU Compositor Transforms (`translate3d`, `scale`, `opacity`)
- **Backend & Database:** Supabase (PostgreSQL with Row-Level Security — RLS)
- **Authentication:** Supabase Auth (JWT-based Role-Based Access Control: Buyer, Seller, Admin)
- **Real-Time Engine:** Supabase Realtime (WebSocket-based messaging & live status sync)
- **Payment Processing:** Stripe (Payment Intents, Stripe Connect Escrow, Verified Webhooks)
- **Media & CDN:** Supabase Storage Buckets with WebP Image Optimization Pipeline
- **Deployment & Hosting:** Vercel (CI/CD, Edge Network, Automated SSL)

---

## 🚀 Core Features

### 1. Cinematic Supercar Page Loader
- Handcrafted, zero-dependency SVG supercar animation featuring volumetric high-beam LED headlight cones and aerodynamic wind lines.
- Independent multi-spoke rotating alloy wheels with glowing turquoise performance calipers.
- Dynamic road lane dashes streaming beneath the chassis and suspension physics.
- Real-time digital telemetry HUD (`STARTING ENGINE` ➔ `CHARGING TURBO` ➔ `LAUNCH READY`) with an animated progress gauge.
- Launch-control acceleration burst that rockets the car offscreen upon page load with instant click-to-skip support.

### 2. Modern Animated Navigation
- Interactive glassmorphic navbar with spring micro-scaling (`hover:-translate-y-0.5 hover:scale-[1.03]`).
- Expanding gradient bottom indicator bar (`scale-x-0` to `scale-x-100`) on hover.
- Dedicated role-based route highlights for Buyers, Sellers, and Admins.
- Glowing danger-gradient Logout button with micro-interactions.

### 3. Buyer Marketplace & Progressive Disclosure
- **Minimalist Vehicle Cards:** Streamlined card face focusing on imagery, pricing badge, and availability status without visual clutter.
- **Interactive Quick-View Modal:** Hover veil (`[ 👁️ Click to see details ]`) opening a full modal dossier with multi-angle image galleries, technical specifications, and verified seller info.
- **Secure Stripe Checkout:** Integrated payment intent flow updating vehicle status to `sold` upon authorization.
- **Buyer Dashboard:** Compact stat cards with animated gradient accents, purchase history, and direct seller communication.

### 4. Seller Inventory & Management Hub
- **Listing Engine:** Multi-image vehicle uploads with WebP optimization and automatic status tracking.
- **Live Inventory Dashboard:** Complete overview of active listings, pending approvals, and completed sales.
- **Sales Analytics:** Real-time revenue metrics, buyer details, and listing performance.

### 5. Real-Time Chat System
- Direct, low-latency buyer-seller messaging powered by Supabase WebSocket subscriptions.
- Persistent conversation history, typing indicators, and message alerts.

### 6. Role-Based Access Control (RBAC) & Database Security
- Strict PostgreSQL Row-Level Security (RLS) policies enforcing zero-trust data access.
- Role-gated interfaces ensuring Buyers, Sellers, and Admins access only authorized operations and endpoints.

### 7. Vehicle Comparison Suite
- Interactive slide-out comparison sidebar enabling side-by-side specification evaluation across multiple cars.

### 8. AI Automotive Assistant
- Floating contextual AI chatbot providing instant vehicle recommendations, market valuations, and buyer guidance.

---

## 📄 License
This project is private and proprietary. All rights reserved.
