# Car Marketplace - Frontend App

A Next.js car marketplace application with mock data functionality. This app demonstrates a complete car buying/selling platform without requiring any external database setup.

## Features

- 🚗 **Car Listings**: Browse available cars with images and details
- 👤 **User Authentication**: Sign up and login functionality (mock)
- 🛒 **Buyer Dashboard**: View and purchase cars
- 📝 **Seller Dashboard**: Add, edit, and manage car listings
- 💾 **Local Storage**: All data persists in browser's local storage
- 🎨 **Modern UI**: Clean and responsive design

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd marketplace_curs
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

### Mock Data System
- **No Database Required**: The app uses browser's local storage instead of a database
- **Pre-loaded Data**: Sample cars and user profiles are automatically loaded
- **Persistent Storage**: Your data stays even after browser refresh
- **Real-time Updates**: Changes are immediately reflected in the UI

### Available Data
- **Sample Cars**: 3 pre-loaded car listings with images
- **Sample Users**: 2 user profiles (buyer and seller)
- **Sample Purchases**: 1 completed purchase record

### User Types
- **Buyers**: Can browse cars and make purchases
- **Sellers**: Can add, edit, and delete car listings

## Pages

- `/` - Homepage with featured cars
- `/cars` - All car listings
- `/cars/[id]` - Individual car details
- `/auth/login` - User login
- `/auth/signup` - User registration
- `/buyer-dashboard` - Buyer's dashboard
- `/seller-dashboard` - Seller's dashboard
- `/add-car` - Add new car listing
- `/edit-car/[id]` - Edit existing car
- `/debug` - Debug information and data status

## Development

### Project Structure
```
marketplace_curs/
├── components/          # Reusable UI components
├── pages/              # Next.js pages
├── styles/             # CSS modules
├── utils/              # Utility functions and mock data
└── public/             # Static assets
```

### Key Files
- `utils/supabaseClient.js` - Mock data service (replaces Supabase)
- `pages/debug.js` - Debug page to check data status
- `components/` - Reusable UI components

## Testing the App

1. **Browse Cars**: Visit `/cars` to see all available cars
2. **Sign Up**: Create a new account at `/auth/signup`
3. **Login**: Use any email/password to login
4. **Add Cars**: As a seller, add new car listings
5. **Make Purchases**: As a buyer, purchase cars
6. **Check Data**: Visit `/debug` to see data status

## Data Persistence

All data is stored in your browser's local storage:
- `marketplace_cars` - Car listings
- `marketplace_profiles` - User profiles
- `marketplace_purchases` - Purchase records
- `marketplace_current_user` - Current logged-in user

## Deployment

This app can be deployed to any static hosting service:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Any static file server

No server-side setup required!

## Technologies Used

- **Next.js** - React framework
- **React** - UI library
- **CSS Modules** - Styling
- **Local Storage** - Data persistence
- **Mock Data** - Sample data system

## License

This project is open source and available under the [MIT License](LICENSE).
