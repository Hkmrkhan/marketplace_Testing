# Luxury Car Marketplace Platform

A high-performance automotive marketplace web application engineered with **Next.js 15**, **React 19**, **Supabase**, **Tailwind CSS**, and **Stripe**. The platform connects vehicle buyers and verified sellers through a modern glassmorphic interface, dual chat systems (real-time WhatsApp-style P2P chat & contextual AI chatbot), a community forum, comprehensive form workflows, escrow-ready payment pipelines, and cinematic GPU-accelerated motion design.

---

## 🛠️ Tech Stack

- **Frontend Framework:** Next.js 15 (Pages Router) & React 19
- **Styling & UI:** Tailwind CSS 3.4, Glassmorphism Design System, CSS Keyframes
- **Motion & Graphics:** Handcrafted Inline SVG, 60fps GPU Compositor Transforms (`translate3d`, `scale`, `opacity`)
- **Backend & Database:** Supabase (PostgreSQL with Row-Level Security — RLS)
- **Authentication:** Supabase Auth (JWT-based Role-Based Access Control: Buyer, Seller, Admin)
- **Real-Time Engine:** Supabase Realtime (WebSocket channels for instant messaging & live status sync)
- **AI Engine:** HuggingFace Inference API & custom marketplace knowledge router (`/api/chat-marketplace.js`, `/api/chat-hf.js`)
- **Payment Processing:** Stripe (Payment Intents, Stripe Connect Escrow, Verified Webhooks)
- **Media & CDN:** Supabase Storage Buckets (`car-images`, `user-avatars`) with WebP Image Optimization Pipeline
- **Deployment & Hosting:** Vercel (CI/CD, Edge Network, Automated SSL)

---

## 💬 Dual Chat Systems

The platform features two distinct, purpose-built chat systems:

### 1. Real-Time Peer-to-Peer Chat (WhatsApp-Style Direct Messaging)
- **Direct Buyer-Seller Communication:** Real-time 1-on-1 messaging modal integrated directly into vehicle cards ("Message Seller") and the seller management dashboard.
- **WebSocket Synchronization:** Powered by Supabase Realtime subscriptions (`supabase.channel`), delivering messages instantly without page refresh or polling.
- **WhatsApp-Like Experience:**
  - Distinct sender and recipient chat bubbles with timestamps.
  - Live unread message counters and badge alerts per car listing.
  - Auto-scrolling message threads with persistent chat history stored in PostgreSQL.
  - Seller identity header displaying verified name, email, and associated car details.
  - Read receipts and message delivery state tracking.

### 2. AI Automotive Assistant (Intelligent Chatbot)
- **Context-Aware Global Assistant:** A floating and embedded AI bot (`components/AIChat.js`) available across marketplace pages.
- **Intelligent Vehicle Recommendations:** Understands natural language requests (e.g., *"Show me luxury sedans under $10,000"* or *"What is the best value SUV for a family?"*).
- **Market Analysis & Seller Pricing Advice:** Guides sellers on competitive pricing strategies, listing optimization, and market trends.
- **Interactive Suggestion Chips:** Quick-prompt buttons for instant buyer and seller questions.
- **Guest & Authenticated Modes:** Provides onboarding and platform navigation guidance for guests while offering personalized assistance for logged-in buyers and sellers.

---

## 🏛️ Community Forum Facility

- **Dedicated Community Hub (`/forum`):** An interactive automotive community space for buyers, sellers, and enthusiasts.
- **Discussion Thread Creation (`/forum/create`):** Users can start discussions on car maintenance, market trends, buying advice, vehicle comparisons, and ownership reviews.
- **Thread Details & Nested Replies (`/forum/discussion/[id]`):** Rich conversation threads with author profile badges, category tags, timestamps, view counters, and real-time community replies.
- **Engagement & Moderation:** Fosters transparent buyer-seller trust and platform community engagement.

---

## 📝 Comprehensive Form Facilities

The platform includes end-to-end form workflows with client-side validation, error handling, and secure database persistence:

1. **Multi-Step Car Listing Form (`pages/add-car.js`, `components/CarForm.js`):**
   - Detailed specification capture: Make, model, year, price, mileage, transmission, fuel type, body type, condition, VIN, and description.
   - Multi-image drag-and-drop uploader with real-time preview and WebP compression.
2. **Listing Edit & Update Form (`pages/edit-car/[id].js`):**
   - Live listing modifier allowing sellers to adjust pricing, update vehicle specs, manage existing photos, and re-submit for approval.
3. **Advanced Filter & Search Form (`components/CarFilter.js`):**
   - Multi-parameter filter form covering price ranges, model years, makes, transmissions, fuel types, and vehicle condition.
   - **Saved Search Presets:** Ability to save custom filter combinations (`/api/save-filter`, `/api/load-filters`, `/api/delete-filter`) for instant one-click reloading.
   - **Voice Search Form (`components/VoiceSearch.js`):** Speech-to-text voice recognition enabling hands-free spoken queries.
4. **Customer Review & Rating Form (`components/ReviewForm.js`):**
   - Interactive 5-star rating system with written feedback submission, verified buyer verification, and seller rating aggregation.
5. **Seller Registration & Verification Form (`/api/seller/register`):**
   - Formal seller onboarding form with business/identity details and verification simulation.
6. **Authentication & Account Forms (`/auth/login`, `/auth/signup`, `/auth/reset-password`):**
   - Role-based registration forms (Buyer vs. Seller), secure credential authentication, and email password reset workflow.
7. **Contact & Support Form (`pages/contact.js`):**
   - Inquiries and customer service form with direct feedback routing.

---

## 🚀 Additional Core Features

### 1. Cinematic Supercar Page Loader (`components/CarPageLoader.js`)
- Handcrafted, zero-dependency SVG supercar animation featuring volumetric high-beam LED headlight cones and aerodynamic wind lines.
- Independent multi-spoke rotating alloy wheels with glowing turquoise performance calipers.
- Dynamic road lane dashes streaming beneath the chassis and suspension vibration physics.
- Real-time digital telemetry HUD (`STARTING ENGINE` ➔ `CHARGING TURBO` ➔ `LAUNCH READY`) with an animated progress gauge.
- Launch-control acceleration burst that rockets the car offscreen upon page load with instant click-to-skip support.

### 2. Modern Animated Navigation (`components/Navbar.js`)
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
- **Live Inventory Dashboard:** Complete overview of active listings, pending approvals, and completed sales.
- **Sales Analytics:** Real-time revenue metrics, buyer details, and listing performance.

### 5. Role-Based Access Control (RBAC) & Database Security
- Strict PostgreSQL Row-Level Security (RLS) policies enforcing zero-trust data access.
- Role-gated interfaces ensuring Buyers, Sellers, and Admins access only authorized operations and endpoints.

### 6. Vehicle Comparison Suite (`/compare`, `components/ComparisonSidebar.js`)
- Interactive slide-out comparison sidebar enabling side-by-side technical specification evaluation across up to 4 vehicles simultaneously.

### 7. Administrative Oversight & Approvals (`pages/admin-dashboard.js`)
- Admin dashboard for reviewing car listings, approving/rejecting listings with feedback, tracking platform commissions, and managing user roles.

---

## 📄 License
This project is private and proprietary. All rights reserved.
