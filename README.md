# Luxury Car Marketplace Platform

A high-performance automotive marketplace web application engineered with **Next.js 15**, **React 19**, **Supabase**, **Tailwind CSS**, and **Stripe**. The platform connects vehicle buyers and verified sellers through three dedicated role-based dashboards, dual chat systems (real-time WhatsApp-style P2P messaging & contextual AI chatbot), a community forum, comprehensive form workflows, automated commission and escrow-ready payment pipelines, and cinematic GPU-accelerated motion design.

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

## 👑 Three Role-Based Dashboards

The application implements strict Role-Based Access Control (RBAC) backed by PostgreSQL Row-Level Security (RLS) policies, providing tailored dashboard experiences for each user role:

### 1. Buyer Dashboard (`/buyer-dashboard`)
Designed with progressive disclosure principles to maximize visual elegance while keeping all discovery and transaction tools accessible:
- **Available Vehicle Catalog:** Browses all approved, active vehicle listings with real-time status indicators.
- **Minimalist Car Cards & Progressive Disclosure:** Streamlined card face focusing on primary imagery, pricing badges, and availability without visual clutter.
- **Interactive Quick-View Modal:** Hover veil (`[ 👁️ Click to see details ]`) opening a full modal dossier with multi-angle image galleries, technical specifications, and verified seller information.
- **Compact Animated Stat Cards:** Dashboard metric cards (Available Cars, Total Purchases, Profile Status) reduced by 50% with animated top gradient accent shimmers and rotating icons.
- **WhatsApp-Style Seller Messaging:** Direct 1-on-1 real-time chat modal to inquire about any vehicle listing.
- **Purchase History ("My Purchases"):** Complete record of purchased vehicles with transaction receipts and ownership status.
- **Profile & Avatar Management:** In-app profile editor with drag-and-drop avatar uploads.
- **AI Assistant Integration:** Floating and embedded AI automotive assistant providing budget-based car recommendations.

### 2. Seller Dashboard (`/seller-dashboard`)
A centralized command center empowering sellers to manage listings, communicate with buyers, and monitor sales performance:
- **Live Inventory Management:** Complete overview of listed vehicles with real-time status tracking (`Auto-Approved`, `Pending Approval`, `Rejected`, or `Sold`).
- **Listing Action Hub:** Rapid links to create new listings (`/add-car`) or edit existing vehicle details, specs, and photos (`/edit-car/[id]`).
- **Real-Time Buyer Inquiry Hub:** WhatsApp-style chat center with live unread message badges to negotiate with interested buyers.
- **Sales & Revenue Analytics:** Tracks total earnings, sold inventory counts, and buyer details.
- **Commission Transparency:** Clear breakdown of platform commission rates (default 10%) and net seller payouts per transaction.
- **Profile Customization:** Update seller bio, contact details, and avatar image.

### 3. Admin Dashboard (`/admin-dashboard`)
An administrative control room ensuring quality control, marketplace safety, and financial oversight:
- **Listing Approval & Moderation Queue:** Review newly submitted car listings before they become visible to buyers. One-click approve (`approve_car()`) or reject with mandatory reason feedback (`reject_car()`).
- **Commission Transactions Ledger:** Detailed tracking of all marketplace commissions via `commission_transactions` with status filters (Pending, Paid, Total Volume).
- **Seller & User Audits:** Inspect user profiles, verify seller identity documents, and manage platform permissions.
- **Financial Analytics:** Monitor gross marketplace volume (GMV), platform fee collections, and active transaction velocity.
- **System Health & Moderation:** Oversight over community reviews, reported listings, and platform integrity.

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
- **Guest & Authenticated Modes:** Provides onboarding guidance for guests while offering personalized assistance for logged-in users.

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
5. **Profile Picture & Avatar Uploader (`components/ProfilePictureUploader.js`):**
   - Drag-and-drop avatar image uploader with preview and size validation backed by the `user-avatars` storage bucket.
6. **Seller Registration & Verification Form (`/api/seller/register`):**
   - Formal seller onboarding form with business/identity details and verification simulation.
7. **Authentication & Account Forms (`/auth/login`, `/auth/signup`, `/auth/reset-password`):**
   - Role-based registration forms (Buyer vs. Seller), secure credential authentication, and email password reset workflow.
8. **Contact & Support Form (`pages/contact.js`):**
   - Inquiries and customer service form with direct feedback routing.

---

## 🏎️ Motion Design & UI/UX Excellence

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

### 3. Vehicle Comparison Suite (`/compare`, `components/ComparisonSidebar.js`)
- Interactive slide-out comparison sidebar enabling side-by-side technical specification evaluation across up to 4 vehicles simultaneously.

---

## 🔒 Security, Database & Media Architecture

### Row-Level Security (RLS) & Role Enforcement
- Client-side Supabase queries are protected by PostgreSQL RLS policies ensuring zero-trust data access.
- Buyers can only access approved listings and their own purchase records.
- Sellers can only modify their own inventory.
- Only Admins can execute approval and commission functions (`approve_car()`, `reject_car()`).

### Media Pipeline Optimization (WebP Conversion)
- All vehicle photos, avatars, and hero media are processed in next-generation **WebP format**, reducing asset payloads by ~68% with zero perceptible quality degradation.
- Media assets are distributed globally via Supabase Storage buckets with edge CDN caching.

### Stripe Payment & Escrow Architecture
- Secure Payment Intent flow with webhook signature verification (`stripe-signature`) and idempotency checks to prevent duplicate processing.
- Automated platform commission collection before seller payout.

---

## 📄 License
This project is private and proprietary. All rights reserved.
