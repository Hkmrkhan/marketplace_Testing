# Car Approval and Commission System

## Overview
Is update mein humne car marketplace mein approval aur commission functionality add ki hai. Ab new cars ko admin approval chahiye hogi pehle k wo buyers ko show hon.

## Database Changes

### New SQL File: `ADD_APPROVAL_COMMISSION.sql`
Ye file run karni hai Supabase SQL Editor mein:

1. **Cars table mein new columns:**
   - `approval_status` - pending/approved/rejected
   - `commission_rate` - default 10%
   - `commission_amount` - calculated commission
   - `approved_by` - admin ID jo approve kiya
   - `approved_at` - approval date
   - `rejection_reason` - rejection reason

2. **New tables:**
   - `admin_approvals` - approval history track karne ke liye
   - `commission_transactions` - commission transactions track karne ke liye

3. **New views:**
   - `cars_with_approval_details` - cars with seller and admin details

4. **New functions:**
   - `approve_car()` - car approve karne ke liye
   - `reject_car()` - car reject karne ke liye
   - `calculate_commission()` - commission calculate karne ke liye

## Frontend Changes

### Admin Dashboard (`pages/admin-dashboard.js`)
- **New approval system:** Admin ab cars ko approve/reject kar sakta hai
- **Rejection modal:** Rejection reason enter karne ke liye modal
- **Commission tracking:** Commission transactions ka complete tracking
- **New tabs:** Commission transactions tab add kiya gaya hai
- **Enhanced stats:** Pending, paid, total commission stats

### Add Car Page (`pages/add-car.js`)
- **Auto pending status:** New cars automatically pending approval status mein add hoti hain

### Cars Listing (`pages/cars/index.js`)
- **Approved cars only:** Sirf approved cars show hoti hain buyers ko

### Buyer Dashboard (`pages/buyer-dashboard.js`)
- **Approved cars only:** Sirf approved cars show hoti hain

### Seller Dashboard (`pages/seller-dashboard.js`)
- **Approval status display:** Sellers ko apni cars ka approval status dikhta hai

## CSS Changes

### Admin Dashboard Styles (`styles/AdminDashboard.module.css`)
- **Commission section styles:** Commission transactions ke liye styles
- **Modal styles:** Rejection modal ke liye styles
- **Status styles:** New status colors (paid, cancelled)

### Dashboard Styles (`styles/Dashboard.module.css`)
- **Approval status styles:** Approval status badges ke liye styles

## Workflow

### For Sellers:
1. Seller car add karta hai
2. Car automatically "pending" approval status mein jati hai
3. Seller dashboard mein approval status dikhta hai
4. Admin approve karne ke baad car buyers ko show hoti hai

### For Admins:
1. Admin dashboard mein "Pending Approvals" tab mein new cars dikhti hain
2. Admin approve ya reject kar sakta hai
3. Reject karne par reason dena zaroori hai
4. Commission transactions track kar sakta hai

### For Buyers:
1. Sirf approved cars dikhti hain
2. Rejected ya pending cars nahi dikhti

## Commission System

### Commission Calculation:
- Default commission rate: 10%
- Commission amount = Sale amount × Commission rate
- Commission transactions table mein track hota hai

### Commission Status:
- **Pending:** Commission calculate hui hai lekin payment nahi hui
- **Paid:** Commission payment ho gayi hai
- **Cancelled:** Commission cancelled ho gayi hai

## Important Notes

1. **Database migration:** `ADD_APPROVAL_COMMISSION.sql` file run karni zaroori hai
2. **Existing cars:** Existing cars automatically approved status mein convert ho jayengi
3. **New cars:** Ab se new cars pending approval status mein add hongi
4. **Admin access:** Sirf admin users approval kar sakte hain

## Testing

1. **Add new car:** Seller ke account se new car add karein
2. **Check pending:** Admin dashboard mein pending approvals check karein
3. **Approve car:** Admin car ko approve karein
4. **Check visibility:** Buyer dashboard mein car show honi chahiye
5. **Test rejection:** Car ko reject karein aur reason dein

## Files Modified

### New Files:
- `ADD_APPROVAL_COMMISSION.sql` - Database changes
- `APPROVAL_COMMISSION_README.md` - This documentation

### Modified Files:
- `pages/admin-dashboard.js` - Admin approval system
- `pages/add-car.js` - Auto pending status
- `pages/cars/index.js` - Approved cars only
- `pages/buyer-dashboard.js` - Approved cars only
- `pages/seller-dashboard.js` - Approval status display
- `styles/AdminDashboard.module.css` - Commission and modal styles
- `styles/Dashboard.module.css` - Approval status styles

