import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context, userId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Get user profile for personalized responses
    let userProfile = null;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      userProfile = profile;
    }

    // Simple fallback for buying/selling tips - ALWAYS WORKS
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('buying') || lowerMessage.includes('buyer')) {
      return res.status(200).json({ 
        message: `🛒 **Buyer Tips for Smart Purchase:**

📊 **Smart buying strategies:**
• **Budget planning** - Set clear price limit before shopping
• **Compare prices** - Check multiple cars before deciding
• **Seller verification** - Contact sellers directly for details
• **Photo inspection** - Choose cars with detailed images
• **Quick decision** - Good deals get sold fast in marketplace

💡 **Negotiation tips:**
• **Market research** - Compare prices with similar cars
• **Condition check** - Ask about car history and maintenance
• **Payment method** - Use secure marketplace payment options
• **Test questions** - Ask specific questions about the car

🎯 **Pro tips:**
• **Best time to buy** - Check market regularly for new listings
• **Communication** - Be polite and professional with sellers
• **Documentation** - Keep records of all communications

🚀 **Ready to find your perfect car?** Start browsing the marketplace!`,
        success: true 
      });
    }
    
    if (lowerMessage.includes('selling') || lowerMessage.includes('seller')) {
      return res.status(200).json({ 
        message: `💼 **Seller Tips for Market Success:**

📊 **Success strategies:**
• **Competitive pricing** - Research market prices before listing
• **High-quality photos** - Upload clear, professional images
• **Detailed description** - Write complete car information
• **Quick responses** - Reply to buyer inquiries fast
• **WhatsApp contact** - Provide direct communication option

💡 **Pricing guidance:**
• **Market research** - Check similar cars in marketplace
• **Honest pricing** - Price fairly based on car condition
• **Quick sale tips** - Price slightly below market average
• **Premium listing** - Add multiple photos and detailed specs

🎯 **Pro tips:**
• **Response time** - Quick replies increase sale chances
• **Professional photos** - Good lighting and multiple angles
• **Honest description** - Build trust with accurate information
• **Availability** - Keep listing updated with current status

🚀 **Ready to start selling?** List your car with confidence!`,
        success: true 
      });
    }
    
    if (lowerMessage.includes('tips') && !lowerMessage.includes('buying') && !lowerMessage.includes('selling')) {
      return res.status(200).json({ 
        message: `🎯 **Marketplace Quick Tips:**

🛒 **For Buyers:**
• Set clear budget before shopping
• Compare multiple options  
• Contact sellers directly
• Check car photos and details
• Ask specific questions about condition

🏪 **For Sellers:**
• Price competitively based on market
• Upload quality photos from multiple angles
• Write detailed descriptions
• Respond quickly to buyer inquiries
• Use WhatsApp for fast communication

💡 **General advice:**
• **Communication** - Be polite and professional
• **Safety** - Meet in safe, public locations
• **Documentation** - Keep records of transactions
• **Trust** - Build good relationships in marketplace

🚀 **Need specific help?**
• Ask **"buying tips"** for detailed buyer advice
• Ask **"selling tips"** for detailed seller strategies  
• Ask **"market status"** for current marketplace trends`,
        success: true 
      });
    }

    // Fetch real marketplace data using corrected AI view
    let availableCars = [];
    let minPrice = 0;
    let maxPrice = 0;
    let avgPrice = 0;

    try {
      // Try to get cars with city information
      let { data: cars } = await supabase
        .from('ai_marketplace_data')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(50);

      // If no data from AI view, try cars_with_seller_enhanced
      if (!cars || cars.length === 0) {
        console.log('No data from ai_marketplace_data, trying fallback view...');
        const { data: fallbackCars } = await supabase
          .from('cars_with_seller_enhanced')
          .select('*')
          .eq('status', 'available')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (fallbackCars) {
          console.log('Using fallback view, transforming data...');
          // Transform fallback data to match AI view format
          cars = fallbackCars.map(car => ({
            ...car,
            numeric_price: parseFloat(car.price) || 0,
            formatted_price: `$${car.price}`,
            price_category: car.price < 1000 ? 'budget' : 
                           car.price < 5000 ? 'mid-range' : 
                           car.price < 10000 ? 'premium' : 'luxury',
            ai_price_range: car.price < 1000 ? 'Budget' : 
                           car.price < 5000 ? 'Mid-Range' : 
                           car.price < 10000 ? 'Premium' : 'Luxury',
            is_available: car.status === 'available',
            days_since_listed: Math.floor((Date.now() - new Date(car.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            // Map city fields properly
            reg_district: car.reg_district || car.registration_district || car.city || 'Unknown'
          }));
        }
      }

      availableCars = cars || [];
      
      // Debug: Log city information
      const cityFields = availableCars.map(car => ({
        id: car.id || car.car_id,
        reg_district: car.reg_district,
        registration_district: car.registration_district,
        city: car.city,
        title: car.title || car.car_title
      })).slice(0, 5); // Show first 5 cars for debugging
      
      console.log('City field debugging (first 5 cars):', cityFields);
      console.log('Available city fields:', Object.keys(availableCars[0] || {}).filter(key => key.toLowerCase().includes('city') || key.toLowerCase().includes('district')));
      
      // Better price calculation
      const prices = availableCars
        .map(car => car.numeric_price || parseFloat(car.price) || 0)
        .filter(price => price > 0 && !isNaN(price));
      
      if (prices.length > 0) {
        minPrice = Math.min(...prices);
        maxPrice = Math.max(...prices);
        avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      } else {
        // Fallback prices if no valid prices found
        minPrice = 100;
        maxPrice = 15000;
        avgPrice = 5000;
      }

      console.log('Fetched cars:', availableCars.length);
      console.log('Price range:', minPrice, '-', maxPrice);
      console.log('$5000+ cars:', availableCars.filter(car => (car.numeric_price || parseFloat(car.price) || 0) >= 5000).length);
      
    } catch (dbError) {
      console.error('Database fetch error:', dbError);
      // Use fallback data if database fails
      availableCars = [];
      minPrice = 100;
      maxPrice = 15000;
      avgPrice = 5000;
    }

    // Process message for marketplace-specific responses
    // Continue with existing complex logic for other queries...
    let response = '';

    // Check if user needs login/signup guidance
    const isLoggedIn = userProfile && userProfile.user_type;
    const needsAuthGuidance = !isLoggedIn && (
      lowerMessage.includes('buy') || lowerMessage.includes('sell') || 
      lowerMessage.includes('purchase') || lowerMessage.includes('contact') ||
      lowerMessage.includes('seller') || lowerMessage.includes('buyer') ||
      lowerMessage.includes('login') || lowerMessage.includes('signup') ||
      lowerMessage.includes('register') || lowerMessage.includes('account') ||
      lowerMessage.includes('dashboard') || lowerMessage.includes('profile')
    );

    // Provide login/signup guidance for non-authenticated users
    if (needsAuthGuidance) {
      if (lowerMessage.includes('sell') || lowerMessage.includes('seller')) {
        response = `🏪 **Seller ke liye Login/Signup Required!**

🎯 **Seller Dashboard Access:**
• **Cars listing aur management**
• **Real-time sales analytics**
• **Buyer inquiries management**
• **Market competition analysis**
• **Pricing strategies & tips**
• **WhatsApp integration for quick contact**

📊 **Current Market Opportunity:**
• **${availableCars.length} cars** already competing
• **Average price:** $${avgPrice}
• **${[...new Set(availableCars.map(car => car.seller_id))].length} active sellers**
• **Market trend:** ${avgPrice < 2000 ? 'Budget cars in demand' : 'Premium segment active'}

🚀 **Register as Seller:**
1. **Signup page** pe jao
2. **"Seller" role** select karo  
3. **Profile complete** karo
4. **Cars listing** start karo

💡 **Ready to start selling?** [Signup kar ke seller dashboard access karo!]`;
      } else if (lowerMessage.includes('buy') || lowerMessage.includes('buyer') || lowerMessage.includes('purchase')) {
        response = `🛒 **Buyer ke liye Login/Signup Required!**

🎯 **Buyer Dashboard Access:**
• **Personalized car recommendations**
• **Budget-based filtering**
• **Seller direct contact**
• **Wishlist management**
• **Purchase history tracking**
• **Real-time price alerts**

📊 **Current Market Overview:**
• **${availableCars.length} cars** available for purchase
• **Price range:** $${minPrice} - $${maxPrice}
• **Fresh inventory** with ${availableCars.filter(car => car.days_since_listed <= 7).length} recent listings
• **Multiple payment options** available

🎁 **Buyer Benefits:**
• **Expert marketplace guidance**
• **Best deal recommendations**  
• **Secure transaction process**
• **Direct seller communication**

🚀 **Register as Buyer:**
1. **Signup page** pe jao
2. **"Buyer" role** select karo
3. **Budget preferences** set karo
4. **Car shopping** start karo

💡 **Ready to find your perfect car?** [Signup kar ke buyer dashboard access karo!]`;
      } else {
        response = `🔐 **Marketplace Access - Login/Signup Required!**

👥 **Choose Your Role:**

🛒 **Buyer Registration:**
• **Browse ${availableCars.length} available cars**
• **Personalized recommendations**
• **Direct seller contact**
• **Secure purchase process**
• **Price range:** $${minPrice} - $${maxPrice}

🏪 **Seller Registration:**  
• **List your cars easily**
• **Market analytics dashboard**
• **Competitor analysis**
• **Pricing strategy guidance**
• **Average market price:** $${avgPrice}

🎯 **Quick Start:**
1. **Signup Page** pe jao
2. **Role select** karo (Buyer/Seller)
3. **Profile complete** karo
4. **Marketplace access** unlock karo

💡 **Both roles** ke liye separate dashboards aur features available hain!

🚀 **Signup/Login kar ke full marketplace experience enjoy karo!**`;
      }
      
      return res.status(200).json({ response });
    }

    // Greeting responses for non-logged in users
    if (!isLoggedIn && (lowerMessage.includes('hello') || lowerMessage.includes('hi') || 
        lowerMessage.includes('assalam') || lowerMessage.includes('salam') ||
        lowerMessage.includes('hey') || lowerMessage.includes('start'))) {
      response = `🤝 **Assalam o Alaikum! Welcome to Car Marketplace!**

🏪 **Real-time Market Status:**
• **${availableCars.length} cars** available
• **Price range:** $${minPrice} - $${maxPrice}
• **${[...new Set(availableCars.map(car => car.seller_id))].length} active sellers**

👤 **Choose Your Journey:**

🛒 **Want to BUY a car?**
• Ask: **"buyer signup"** or **"buy car"**
• Get personalized recommendations
• Direct seller contact

🏪 **Want to SELL your car?**
• Ask: **"seller registration"** or **"sell car"**  
• Market analysis & pricing tips
• Professional listing tools

💬 **Just browsing?**
• Ask: **"cheapest car kya hai?"**
• Ask: **"market status check karo"**
• Ask: **"budget $500 options?"**

🚀 **Ready to start?** Simply type:
**"buyer account"**, **"seller account"**, or **"market browse"**

💡 **Full marketplace features unlock after signup!**`;
      
      return res.status(200).json({ response });
    }

    // Dynamic responses based on real data
    if (lowerMessage.includes('budget') || lowerMessage.includes('price range') || lowerMessage.includes('afford') ||
        lowerMessage.includes('dolar') || lowerMessage.includes('dollar') || 
        /\$?\d+\s*(dolar|dollar|price|wali|mein|under)/i.test(message)) {
      const budgetMatch = message.match(/\$?(\d+)/);
      const budget = budgetMatch ? parseInt(budgetMatch[1]) : null;
      
            if (budget) {
        // Find cars at exact price or within ±15% range (corrected logic)
        const exactPriceCars = availableCars.filter(car => car.numeric_price === budget);
        const nearPriceCars = availableCars.filter(car => {
          const price = car.numeric_price;
          return price >= budget * 0.85 && price <= budget * 1.15;
        });
        
        if (exactPriceCars.length > 0) {
          const carDetails = exactPriceCars.slice(0, 2).map(car => {
            let details = `**🚗 ${car.title}** - **${car.formatted_price}**
💰 **Seller:** ${car.seller_name || 'Unknown'}`;
            
            // Add miles info if available
            if (car.miles && car.miles > 0) {
              details += `\n📏 **Miles:** ${car.miles.toLocaleString()}`;
            }
            
            // Add year info if available
            if (car.year) {
              details += `\n📅 **Year:** ${car.year}`;
            }
            
            // Add city info if available
            if (car.reg_district) {
              details += `\n📍 **City:** ${car.reg_district}`;
            }
            
            details += `\n📝 **Description:** ${car.description?.substring(0, 80) || 'No description available'}...
📅 **Listed:** ${car.days_since_listed} days ago`;
            
            return details;
          }).join('\n\n');
          response = `✅ **Exact $${budget} price mein ye cars milti hain:**

${carDetails}

🛒 **Total ${exactPriceCars.length} cars available at this exact price!**`;
        } else if (nearPriceCars.length > 0) {
          const carDetails = nearPriceCars.slice(0, 3).map(car => {
            let details = `**🚗 ${car.title}** - **${car.formatted_price}**
💰 **Seller:** ${car.seller_name || 'Unknown'}`;
            
            // Add miles info if available
            if (car.miles && car.miles > 0) {
              details += `\n📏 **Miles:** ${car.miles.toLocaleString()}`;
            }
            
            // Add year info if available
            if (car.year) {
              details += `\n📅 **Year:** ${car.year}`;
            }
            
            // Add city info if available
            if (car.reg_district) {
              details += `\n📍 **City:** ${car.reg_district}`;
            }
            
            details += `\n📊 **Category:** ${car.price_category}`;
            
            return details;
          }).join('\n\n');
          response = `💡 **$${budget} ke similar range mein ye cars available hain:**

${carDetails}

📊 **Total ${nearPriceCars.length} cars in this price range!**`;
        } else {
          const affordableCars = availableCars.filter(car => car.numeric_price <= budget && car.numeric_price > 0);
          if (affordableCars.length > 0) {
            const cheapestAffordable = affordableCars.reduce((min, car) => 
              car.numeric_price < min.numeric_price ? car : min
            );
            
            let details = `❌ **$${budget} exact price mein koi car nahi hai.**

💰 **Aap ke budget mein best option:** "${cheapestAffordable.title}" - **${cheapestAffordable.formatted_price}**
📊 **Category:** ${cheapestAffordable.price_category}`;
            
            // Add miles info if available
            if (cheapestAffordable.miles && cheapestAffordable.miles > 0) {
              details += `\n📏 **Miles:** ${cheapestAffordable.miles.toLocaleString()}`;
            }
            
            // Add year info if available
            if (cheapestAffordable.year) {
              details += `\n📅 **Year:** ${cheapestAffordable.year}`;
            }
            
            // Add city info if available
            if (cheapestAffordable.reg_district) {
              details += `\n📍 **City:** ${cheapestAffordable.reg_district}`;
            }
            
            details += `\n\n📈 **Higher options $${minPrice} se start hoti hai marketplace mein.**`;
            
            response = details;
          } else {
            response = `❌ **$${budget} budget mein koi car available nahi hai.**

💰 **Minimum price:** $${minPrice}
📊 **Average price:** $${avgPrice}
🎯 **Most affordable:** ${availableCars.find(car => car.numeric_price === minPrice)?.title || 'Check cars page'}

💡 **Budget thoda increase kar sakte hain?**`;
          }
        }
      } else {
        response = `📊 Current marketplace stats:\n💰 Price range: $${minPrice} - $${maxPrice}\n📈 Average: $${avgPrice}\n🚗 Total cars: ${availableCars.length}\n\n💬 Specific budget amount batayiye!`;
      }
    }
    
    else if (lowerMessage.includes('cheapest') || lowerMessage.includes('cheap') || lowerMessage.includes('minimum') || 
             lowerMessage.includes('sasti') || lowerMessage.includes('sasta') || 
             lowerMessage.includes('$100') || lowerMessage.includes('100') ||
             lowerMessage.includes('kam price') || lowerMessage.includes('low price')) {
      const cheapestCar = availableCars.find(car => car.numeric_price === minPrice);
      if (cheapestCar) {
        let details = `🚗 **Sabse sasti car:** "${cheapestCar.title}" - **${cheapestCar.formatted_price}**

💰 **Seller:** ${cheapestCar.seller_name || 'Unknown Seller'}
📊 **Category:** ${cheapestCar.price_category} (${cheapestCar.ai_price_range})`;
        
        // Add miles info if available
        if (cheapestCar.miles && cheapestCar.miles > 0) {
          details += `\n📏 **Miles:** ${cheapestCar.miles.toLocaleString()}`;
        }
        
        // Add year info if available
        if (cheapestCar.year) {
          details += `\n📅 **Year:** ${cheapestCar.year}`;
        }
        
                    // Add city info if available
            if (cheapestCar.reg_district) {
              details += `\n📍 **City:** ${cheapestCar.reg_district}`;
            }
        
        details += `\n📅 **Listed:** ${cheapestCar.days_since_listed} days ago
📸 **Images:** ${cheapestCar.has_images ? 'Available' : 'Not uploaded'}
📝 **Description:** ${cheapestCar.description?.substring(0, 100) || 'Description not available'}...
📞 **Contact:** ${cheapestCar.seller_whatsapp ? 'WhatsApp available' : 'Use marketplace chat'}

🛒 **How to buy:** Browse cars here → Login as buyer → Purchase from dashboard**`;
        
        response = details;
      } else {
        response = `Currently marketplace mein koi cars available nahi hain. Database check kar rahe hain...`;
      }
    }
    
    else if (lowerMessage.includes('expensive') || lowerMessage.includes('premium') || lowerMessage.includes('luxury')) {
      const expensiveCar = availableCars.find(car => car.numeric_price === maxPrice);
      if (expensiveCar) {
        let details = `💎 **Premium car:** "${expensiveCar.title}" - **${expensiveCar.formatted_price}**

🏆 **Category:** ${expensiveCar.price_category} (${expensiveCar.ai_price_range})
💰 **Seller:** ${expensiveCar.seller_name || 'Premium Seller'}`;
        
        // Add miles info if available
        if (expensiveCar.miles && expensiveCar.miles > 0) {
          details += `\n📏 **Miles:** ${expensiveCar.miles.toLocaleString()}`;
        }
        
        // Add year info if available
        if (expensiveCar.year) {
          details += `\n📅 **Year:** ${expensiveCar.year}`;
        }
        
                    // Add city info if available
            if (expensiveCar.reg_district) {
              details += `\n📍 **City:** ${expensiveCar.reg_district}`;
            }
        
        details += `\n⭐ **Top quality aur features ke saath!**
📸 **Images:** ${expensiveCar.additional_images_count + (expensiveCar.has_images ? 1 : 0)} photos available
📅 **Listed:** ${expensiveCar.days_since_listed} days ago

🎯 **Luxury segment mein ye best option hai marketplace mein!**`;
        
        response = details;
      } else {
        response = `Currently koi premium cars available nahi hain marketplace mein. Budget cars check kar sakte hain!`;
      }
    }
    
    else if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('konsi car')) {
      if (userProfile?.user_type === 'buyer') {
        const midRangeCars = availableCars.filter(car => {
          const price = car.numeric_price;
          return price >= avgPrice * 0.7 && price <= avgPrice * 1.3;
        }).slice(0, 3);
        
        if (midRangeCars.length > 0) {
          const carDetails = midRangeCars.map(car => {
            let details = `**🚗 ${car.title}** - **${car.formatted_price}**
📊 **${car.price_category} category** 
💰 **Seller:** ${car.seller_name || 'Verified Seller'}`;
            
            // Add miles info if available
            if (car.miles && car.miles > 0) {
              details += `\n📏 **Miles:** ${car.miles.toLocaleString()}`;
            }
            
            // Add year info if available
            if (car.year) {
              details += `\n📅 **Year:** ${car.year}`;
            }
            
            // Add city info if available
            if (car.reg_district) {
              details += `\n📍 **City:** ${car.reg_district}`;
            }
            
            details += `\n⭐ **${car.has_images ? 'Photos available' : 'No photos yet'}**`;
            
            return details;
          }).join('\n\n');
          response = `🎯 **Aap ke liye best recommendations (value for money):**

${carDetails}

💡 **Ye cars average price range mein hain aur good value offer karte hain!**`;
        } else {
          response = `📊 Current marketplace mein ${availableCars.length} cars available hain ($${minPrice} - $${maxPrice} range mein). Browse kar ke dekh sakte hain!`;
        }
      } else {
        response = `🏪 Marketplace mein currently ${availableCars.length} cars available hain
💰 Price range: $${minPrice} - $${maxPrice}
📈 Average price: $${avgPrice}

🔥 Popular categories:
• Budget cars: Under $1000
• Mid-range: $1000-$5000  
• Premium: $5000-$10000
• Luxury: Above $10000

Koi specific price range ya features chahiye?`;
      }
    }
    
    // Handle all types of tips queries with simple conditions
    else if (lowerMessage.includes('buying') || lowerMessage.includes('buyer')) {
      response = `🛒 **Buyer Tips for Smart Purchase:**

📊 **Current market analysis:**
• **${availableCars.length} cars** available for purchase
• **Price range:** $${minPrice} - $${maxPrice}
• **Average price:** $${avgPrice}

🎯 **Smart buying strategies:**
• **Budget planning** - Set clear price limit before shopping
• **Compare prices** - Check multiple options
• **Seller verification** - Contact sellers directly
• **Photo inspection** - Choose cars with detailed images
• **Quick decision** - Good deals get sold fast

💡 **Negotiation tips:**
• **Market research** - Average price is $${avgPrice}
• **Condition check** - Ask about car history
• **Payment method** - Use secure marketplace payment
• **Test queries** - Ask specific questions about the car

${!userId ? '\n🚀 **For personalized buyer features:** Signup as buyer!' : ''}`;
    }
    
    else if (lowerMessage.includes('selling') || lowerMessage.includes('seller')) {
      response = `💼 **Seller Tips for Market Success:**

📊 **Current market analysis:**
• **${availableCars.length} cars** currently competing  
• **Average price:** $${avgPrice}
• **Market status:** ${avgPrice < 3000 ? 'Budget cars in demand' : 'Premium segment active'}

🎯 **Success strategies:**
• **Competitive pricing** - Market average ke near rakho
• **High-quality photos** - Professional images upload karo
• **Detailed description** - Complete information likho
• **Quick responses** - Buyers ko fast reply do
• **WhatsApp contact** - Direct communication ke liye

💡 **Pricing guidance:**
• **Recommended range:** $${Math.round(avgPrice * 0.9)} - $${Math.round(avgPrice * 1.1)}
• **Quick sale tip:** Price slightly below average
• **Premium listing:** Add multiple photos

${!userId ? '\n🚀 **For detailed seller analytics:** Signup as seller!' : ''}`;
    }
    
    else if (lowerMessage.includes('tips') || lowerMessage.includes('guide') || lowerMessage.includes('help')) {
      response = `🎯 **Marketplace Quick Tips:**

🛒 **For Buyers:**
• Set clear budget before shopping
• Compare multiple options  
• Contact sellers directly
• Check car photos and details
• Ask specific questions

🏪 **For Sellers:**
• Price competitively (avg: $${avgPrice})
• Upload quality photos
• Write detailed descriptions
• Respond quickly to buyers
• Use WhatsApp for fast contact

📊 **Live Market:** ${availableCars.length} cars available

💡 **Detailed guidance:**
• Ask **"buying tips"** for buyer advice
• Ask **"selling tips"** for seller strategies  
• Ask **"market analysis"** for current trends

🚀 **Join marketplace:** Signup as buyer or seller for personalized features!`;
    }
    
    else if (lowerMessage.includes('total') || lowerMessage.includes('kitni cars') || lowerMessage.includes('marketplace status') ||
             lowerMessage.includes('market status') || lowerMessage.includes('status')) {
      
      // Enhanced market status with detailed price breakdowns
      const categoryStats = {
        budget: availableCars.filter(car => {
          const price = car.numeric_price || parseFloat(car.price) || 0;
          return price > 0 && price <= 1000;
        }).length,
        midRange: availableCars.filter(car => {
          const price = car.numeric_price || parseFloat(car.price) || 0;
          return price > 1000 && price <= 5000;
        }).length,
        premium: availableCars.filter(car => {
          const price = car.numeric_price || parseFloat(car.price) || 0;
          return price > 5000 && price <= 10000;
        }).length,
        luxury: availableCars.filter(car => {
          const price = car.numeric_price || parseFloat(car.price) || 0;
          return price > 10000;
        }).length
      };
      
      // Detailed price breakdowns
      const priceBreakdowns = {
        under1k: availableCars.filter(car => {
          const price = car.numeric_price || parseFloat(car.price) || 0;
          return price > 0 && price <= 1000;
        }).length,
        oneTo2k: availableCars.filter(car => {
          const price = car.numeric_price || parseFloat(car.price) || 0;
          return price > 1000 && price <= 2000;
        }).length,
        twoTo5k: availableCars.filter(car => {
          const price = car.numeric_price || parseFloat(car.price) || 0;
          return price > 2000 && price <= 5000;
        }).length,
        fiveTo10k: availableCars.filter(car => {
          const price = car.numeric_price || parseFloat(car.price) || 0;
          return price > 5000 && price <= 10000;
        }).length,
        tenTo15k: availableCars.filter(car => {
          const price = car.numeric_price || parseFloat(car.price) || 0;
          return price > 10000 && price <= 15000;
        }).length,
        above15k: availableCars.filter(car => {
          const price = car.numeric_price || parseFloat(car.price) || 0;
          return price > 15000;
        }).length
      };
      
      const sellersCount = [...new Set(availableCars.map(car => car.seller_id))].length;
      const recentListings = availableCars.filter(car => {
        const days = car.days_since_listed || 0;
        return days <= 7;
      }).length;
      
      // Calculate price distribution
      const totalCarsWithPrices = availableCars.filter(car => {
        const price = car.numeric_price || parseFloat(car.price) || 0;
        return price > 0;
      }).length;
      
      // City-based breakdown
      const cityStats = {};
      availableCars.forEach(car => {
        const city = car.reg_district || 'Unknown';
        if (!cityStats[city]) {
          cityStats[city] = {
            count: 0,
            avgPrice: 0,
            totalPrice: 0
          };
        }
        const price = car.numeric_price || parseFloat(car.price) || 0;
        cityStats[city].count++;
        cityStats[city].totalPrice += price;
      });
      
      // Calculate average prices for cities
      Object.keys(cityStats).forEach(city => {
        if (cityStats[city].count > 0) {
          cityStats[city].avgPrice = Math.round(cityStats[city].totalPrice / cityStats[city].count);
        }
      });
      
      // Sort cities by car count
      const sortedCities = Object.entries(cityStats)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 5); // Top 5 cities
      
      console.log('Enhanced market status analysis:', {
        totalCars: availableCars.length,
        carsWithPrices: totalCarsWithPrices,
        categoryStats,
        priceBreakdowns,
        cityStats: sortedCities,
        priceRange: `${minPrice} - ${maxPrice}`,
        avgPrice
      });
      
      let response = `📊 **Complete Marketplace Status Report:**

🚗 **Inventory Overview:**
• **Total available cars:** ${availableCars.length}
• **Cars with valid prices:** ${totalCarsWithPrices}
• **Active sellers:** ${sellersCount}
• **Recent listings (7 days):** ${recentListings}

💰 **Price Analysis:**
• **Range:** $${minPrice} - $${maxPrice}
• **Average:** $${avgPrice}
• **Cheapest option:** $${minPrice}
• **Premium option:** $${maxPrice}

🎯 **Detailed Price Breakdown:**
• **Budget (≤$1K):** ${priceBreakdowns.under1k} cars
• **$1K-$2K:** ${priceBreakdowns.oneTo2k} cars
• **$2K-$5K:** ${priceBreakdowns.twoTo5k} cars
• **$5K-$10K:** ${priceBreakdowns.fiveTo10k} cars **⭐**
• **$10K-$15K:** ${priceBreakdowns.tenTo15k} cars **💎**
• **$15K+:** ${priceBreakdowns.above15k} cars **🏆**

🏙️ **Top Cities by Car Availability:**
${sortedCities.map(([city, stats]) => 
  `• **${city}:** ${stats.count} cars (avg: $${stats.avgPrice})`
).join('\n')}

📈 **Market Activity:** ${recentListings > availableCars.length * 0.3 ? 'High activity - fresh inventory!' : 'Stable market with quality options'}

💡 **Best time to** ${userProfile?.user_type === 'buyer' ? 'buy - good selection available!' : userProfile?.user_type === 'seller' ? 'sell - active market!' : 'join - active marketplace!'}

🔍 **Quick Queries:**
• Ask **"premium cars"** for $5000+ analysis
• Ask **"luxury cars"** for $10000+ analysis
• Ask **"cars in [city]"** for city-specific options
• Ask **"budget cars"** for affordable options
• Ask **"market trends"** for detailed insights`;
      
      return res.status(200).json({ message: response, success: true });
    }
    
    else if (lowerMessage.includes('seller') && userProfile?.user_type === 'buyer') {
      const sellers = [...new Set(availableCars.map(car => car.seller_name).filter(name => name))];
      const sellersWithWhatsApp = availableCars.filter(car => car.seller_whatsapp).length;
      const topSellers = sellers.slice(0, 5);
      
      response = `👥 Active Marketplace Sellers:

🏪 Top sellers: ${topSellers.join(', ')}${sellers.length > 5 ? ` aur ${sellers.length - 5} more sellers` : ''}

📊 Seller Stats:
• Total active sellers: ${sellers.length}
• WhatsApp contact available: ${sellersWithWhatsApp} sellers
• Average cars per seller: ${Math.round(availableCars.length / sellers.length) || 1}

📞 Contact Options:
• Direct WhatsApp (${Math.round(sellersWithWhatsApp/availableCars.length*100)}% sellers)
• Marketplace chat system
• Car page contact forms

💡 Pro tip: Cars page se direct seller contact kar sakte hain!`;
    }
    
    // City-based filtering queries - COMPLETELY REWRITTEN
    else if (lowerMessage.includes('city') || lowerMessage.includes('shahar') || lowerMessage.includes('city mein') ||
             lowerMessage.includes('karachi') || lowerMessage.includes('lahore') || lowerMessage.includes('islamabad') ||
             lowerMessage.includes('rawalpindi') || lowerMessage.includes('peshawar') || lowerMessage.includes('quetta') ||
             lowerMessage.includes('multan') || lowerMessage.includes('faisalabad') || lowerMessage.includes('sialkot') ||
             lowerMessage.includes('gujranwala') || lowerMessage.includes('bahawalpur') || lowerMessage.includes('sargodha') ||
             /\w+\s+city\s+cars/i.test(message) || /\w+\s+shahar\s+cars/i.test(message) || 
             /\w+\s+mein\s+cars/i.test(message) || /\w+\s+ke\s+cars/i.test(message) ||
             /\w+\s+mein\s+kya\s+hai/i.test(message) || /\w+\s+ke\s+options/i.test(message)) {
      
      console.log('🚀 City query detected:', message);
      
      // Helper function to get city from car data
      const getCarCity = (car) => {
        return car.reg_district || car.registration_district || car.city || car.reg_city || 'Unknown';
      };
      
      // Get all unique cities from available cars
      const allCities = [...new Set(availableCars.map(car => getCarCity(car)).filter(city => 
        city && city !== 'Other' && city !== 'Unknown' && city !== 'null' && city !== ''
      ))];
      
      console.log('🏙️ Available cities in database:', allCities);
      
      // Extract city name from message with multiple patterns
      const cities = [
        'karachi', 'lahore', 'islamabad', 'rawalpindi', 'peshawar', 'quetta', 
        'multan', 'faisalabad', 'sialkot', 'gujranwala', 'bahawalpur', 'sargodha'
      ];
      
      let cityMatch = null;
      
      // Pattern 1: "cars in [city]"
      const cityInPattern = message.match(/cars?\s+in\s+(\w+)/i);
      if (cityInPattern) {
        const potentialCity = cityInPattern[1].toLowerCase();
        cityMatch = cities.find(city => city.includes(potentialCity) || potentialCity.includes(city));
        console.log('Pattern 1 match:', potentialCity, '→', cityMatch);
      }
      
      // Pattern 2: "[city] mein cars"
      if (!cityMatch) {
        const cityMeinPattern = message.match(/(\w+)\s+mein\s+cars?/i);
        if (cityMeinPattern) {
          const potentialCity = cityMeinPattern[1].toLowerCase();
          cityMatch = cities.find(city => city.includes(potentialCity) || potentialCity.includes(city));
          console.log('Pattern 2 match:', potentialCity, '→', cityMatch);
        }
      }
      
      // Pattern 3: "[city] ke cars"
      if (!cityMatch) {
        const cityKePattern = message.match(/(\w+)\s+ke\s+cars?/i);
        if (cityKePattern) {
          const potentialCity = cityKePattern[1].toLowerCase();
          cityMatch = cities.find(city => city.includes(potentialCity) || potentialCity.includes(city));
          console.log('Pattern 3 match:', potentialCity, '→', cityMatch);
        }
      }
      
      // Pattern 4: "[city] mein kya hai"
      if (!cityMatch) {
        const cityKyaPattern = message.match(/(\w+)\s+mein\s+kya\s+hai/i);
        if (cityKyaPattern) {
          const potentialCity = cityKyaPattern[1].toLowerCase();
          cityMatch = cities.find(city => city.includes(potentialCity) || potentialCity.includes(city));
          console.log('Pattern 4 match:', potentialCity, '→', cityMatch);
        }
      }
      
      // Pattern 5: Direct city mention
      if (!cityMatch) {
        cityMatch = cities.find(city => lowerMessage.includes(city));
        console.log('Pattern 5 (direct) match:', cityMatch);
      }
      
      console.log('🎯 Final city match:', cityMatch);
      
      if (cityMatch) {
        // Find cars in the specified city
        const cityCars = availableCars.filter(car => {
          const carCity = getCarCity(car);
          return carCity.toLowerCase().includes(cityMatch) || cityMatch.includes(carCity.toLowerCase());
        });
        
        console.log(`🏙️ Found ${cityCars.length} cars in ${cityMatch}`);
        
        if (cityCars.length > 0) {
          // Calculate city statistics
          const cityAvgPrice = Math.round(
            cityCars.reduce((sum, car) => {
              const price = car.numeric_price || parseFloat(car.price) || 0;
              return sum + price;
            }, 0) / cityCars.length
          );
          
          const cityPriceBreakdown = {
            budget: cityCars.filter(car => {
              const price = car.numeric_price || parseFloat(car.price) || 0;
              return price > 0 && price <= 1000;
            }).length,
            midRange: cityCars.filter(car => {
              const price = car.numeric_price || parseFloat(car.price) || 0;
              return price > 1000 && price <= 5000;
            }).length,
            premium: cityCars.filter(car => {
              const price = car.numeric_price || parseFloat(car.price) || 0;
              return price > 5000 && price <= 10000;
            }).length,
            luxury: cityCars.filter(car => {
              const price = car.numeric_price || parseFloat(car.price) || 0;
              return price > 10000;
            }).length
          };
          
          // Get top 3 cars from the city
          const topCityCars = cityCars.slice(0, 3);
          const carDetails = topCityCars.map(car => {
            let details = `**${car.title || car.car_title || 'Car'}** - **$${car.formatted_price || car.price}**`;
            
            if (car.miles && car.miles > 0) {
              details += `\n📏 **Miles:** ${car.miles.toLocaleString()}`;
            }
            
            if (car.year) {
              details += `\n📅 **Year:** ${car.year}`;
            }
            
            if (car.seller_name) {
              details += `\n💰 **Seller:** ${car.seller_name}`;
            }
            
            return details;
          }).join('\n\n');
          
          const response = `🏙️ **${cityMatch.charAt(0).toUpperCase() + cityMatch.slice(1)} City Cars Analysis:**

📊 **City Overview:**
• **Total cars available:** ${cityCars.length}
• **Average price:** $${cityAvgPrice}
• **Price range:** $${Math.min(...cityCars.map(car => car.numeric_price || parseFloat(car.price) || 0).filter(p => p > 0))} - $${Math.max(...cityCars.map(car => car.numeric_price || parseFloat(car.price) || 0).filter(p => p > 0))}

🎯 **Price Breakdown in ${cityMatch.charAt(0).toUpperCase() + cityMatch.slice(1)}:**
• **Budget (≤$1K):** ${cityPriceBreakdown.budget} cars
• **Mid-range ($1K-$5K):** ${cityPriceBreakdown.midRange} cars
• **Premium ($5K-$10K):** ${cityPriceBreakdown.premium} cars
• **Luxury ($10K+):** ${cityPriceBreakdown.luxury} cars

🏆 **Top ${cityMatch.charAt(0).toUpperCase() + cityMatch.slice(1)} Cars:**
${carDetails}

💡 **City-specific tips:**
• **Local market:** ${cityMatch.charAt(0).toUpperCase() + cityMatch.slice(1)} has ${cityCars.length} cars available
• **Price trend:** Average price is $${cityAvgPrice}
• **Selection:** ${cityPriceBreakdown.premium + cityPriceBreakdown.luxury > 0 ? 'Premium options available!' : 'Focus on budget and mid-range'}

🚀 **Ready to explore ${cityMatch.charAt(0).toUpperCase() + cityMatch.slice(1)} cars?** Browse the marketplace!`;
          
          return res.status(200).json({ message: response, success: true });
        } else {
          return res.status(200).json({ 
            message: `🏙️ **${cityMatch.charAt(0).toUpperCase() + cityMatch.slice(1)} City Status:**

❌ **Currently no cars available** in ${cityMatch.charAt(0).toUpperCase() + cityMatch.slice(1)}

💡 **Suggestions:**
• **Check nearby cities** for more options
• **Expand your search** to include other locations
• **Set up alerts** for when cars become available in ${cityMatch.charAt(0).toUpperCase() + cityMatch.slice(1)}

🔍 **Try asking:**
• "Market status" for overall availability
• "Cars in [other city]" for alternatives
• "Budget cars" for affordable options`,
            success: true 
          });
        }
      } else {
        // Show all available cities
        const cityStats = allCities.map(city => {
          const cityCars = availableCars.filter(car => getCarCity(car) === city);
          const avgPrice = Math.round(
            cityCars.reduce((sum, car) => {
              const price = car.numeric_price || parseFloat(car.price) || 0;
              return sum + price;
            }, 0) / cityCars.length
          );
          return { city, count: cityCars.length, avgPrice };
        }).sort((a, b) => b.count - a.count);
        
        const response = `🏙️ **City-based Car Availability:**

📊 **Available Cities:**
${cityStats.map(stat => 
  `• **${stat.city}:** ${stat.count} cars (avg: $${stat.avgPrice})`
).join('\n')}

💡 **How to use city filtering:**
• **English:** "cars in Karachi", "cars in Lahore"
• **Urdu:** "Karachi mein cars", "Lahore ke cars"
• **Alternative:** "Karachi mein kya hai", "Rawalpindi ke options"

🎯 **Popular cities:** ${cityStats.slice(0, 3).map(stat => stat.city).join(', ')} have the most cars

🔍 **Try these examples:**
• "cars in Islamabad" → Islamabad cars
• "Rawalpindi mein cars" → Rawalpindi options
• "Karachi ke cars" → Karachi availability
• "Lahore mein kya hai" → Lahore overview`;
        
        return res.status(200).json({ message: response, success: true });
      }
    }
    
    // Premium cars ($5000+) specific queries
    else if (lowerMessage.includes('5000') || lowerMessage.includes('5000+') || lowerMessage.includes('5k') || 
             lowerMessage.includes('5k+') || lowerMessage.includes('premium cars') || lowerMessage.includes('premium segment')) {
      
      const premiumCars = availableCars.filter(car => {
        const price = car.numeric_price || parseFloat(car.price) || 0;
        return price >= 5000 && price > 0;
      });
      
      if (premiumCars.length > 0) {
        const premiumBreakdown = {
          fiveTo7k: premiumCars.filter(car => {
            const price = car.numeric_price || parseFloat(car.price) || 0;
            return price >= 5000 && price <= 7000;
          }).length,
          sevenTo10k: premiumCars.filter(car => {
            const price = car.numeric_price || parseFloat(car.price) || 0;
            return price > 7000 && price <= 10000;
          }).length,
          tenTo15k: premiumCars.filter(car => {
            const price = car.numeric_price || parseFloat(car.price) || 0;
            return price > 10000 && price <= 15000;
          }).length,
          above15k: premiumCars.filter(car => {
            const price = car.numeric_price || parseFloat(car.price) || 0;
            return price > 15000;
          }).length
        };
        
        const avgPremiumPrice = Math.round(
          premiumCars.reduce((sum, car) => {
            const price = car.numeric_price || parseFloat(car.price) || 0;
            return sum + price;
          }, 0) / premiumCars.length
        );
        
        const topPremiumCars = premiumCars.slice(0, 3);
        const carDetails = topPremiumCars.map(car => {
          let details = `**${car.title || car.car_title || 'Premium Car'}** - **$${car.formatted_price || car.price}**`;
          
          if (car.miles && car.miles > 0) {
            details += `\n📏 **Miles:** ${car.miles.toLocaleString()}`;
          }
          
          if (car.year) {
            details += `\n📅 **Year:** ${car.year}`;
          }
          
          if (car.reg_district) {
            details += `\n📍 **City:** ${car.reg_district}`;
          }
          
          if (car.seller_name) {
            details += `\n💰 **Seller:** ${car.seller_name}`;
          }
          
          return details;
        }).join('\n\n');
        
        const response = `💎 **Premium Cars Analysis ($5000+):**

📊 **Premium Market Overview:**
• **Total premium cars:** ${premiumCars.length} available
• **Average premium price:** $${avgPremiumPrice}
• **Price range:** $5000 - $${Math.max(...premiumCars.map(car => car.numeric_price || parseFloat(car.price) || 0))}

🎯 **Detailed Premium Breakdown:**
• **$5K-$7K:** ${premiumBreakdown.fiveTo7k} cars (Entry premium)
• **$7K-$10K:** ${premiumBreakdown.sevenTo10k} cars (Mid premium)
• **$10K-$15K:** ${premiumBreakdown.tenTo15k} cars (High premium)
• **$15K+:** ${premiumBreakdown.above15k} cars (Luxury premium)

🏆 **Top Premium Options:**
${carDetails}

💡 **Premium Market Insights:**
• **Investment value:** Premium cars hold value better over time
• **Quality assurance:** Higher price = better condition and features
• **Technology:** Advanced features and modern amenities
• **Resale potential:** Good for long-term ownership

🎯 **Best for:** Serious buyers, long-term investment, premium experience seekers

🚀 **Ready to explore premium options?** Browse the marketplace for detailed listings!`;
        
        return res.status(200).json({ message: response, success: true });
      } else {
        return res.status(200).json({ 
          message: `💎 **Premium Cars ($5000+) Status:**

❌ **Currently no premium cars available** in the $5000+ range

💡 **Market Analysis:**
• **Premium demand:** High - premium cars sell quickly
• **Market trend:** Currently favoring budget and mid-range options
• **Opportunity:** Consider listing premium cars for better profits

🎯 **Alternative Options:**
• **Mid-range cars:** $1000-$5000 range available
• **Budget cars:** Under $1000 options
• **Market status:** Check overall availability

🔍 **Try asking:**
• "Market status" for complete overview
• "Budget cars" for affordable options
• "Mid-range cars" for $1000-$5000 range`,
          success: true 
        });
      }
    }
    
    // Test query for debugging
    else if (lowerMessage.includes('test city') || lowerMessage.includes('city test')) {
      const allCities = [...new Set(availableCars.map(car => car.reg_district).filter(city => city && city !== 'Other' && city !== 'Unknown'))];
      const cityStats = allCities.map(city => {
        const cityCars = availableCars.filter(car => car.reg_district === city);
        return { city, count: cityCars.length };
      }).sort((a, b) => b.count - a.count);
      
      const response = `🧪 **City Filtering Test Results:**

📊 **Available Cities in Database:**
${cityStats.map(stat => 
  `• **${stat.city}:** ${stat.count} cars`
).join('\n')}

🔍 **Total Cities Found:** ${cityStats.length}
📈 **Total Cars with City Data:** ${cityStats.reduce((sum, stat) => sum + stat.count, 0)}

💡 **Test City Queries:**
• "cars in Karachi" → Should show Karachi cars
• "Rawalpindi mein cars" → Should show Rawalpindi cars
• "Lahore ke cars" → Should show Lahore cars
• "cars in Islamabad" → Should show Islamabad cars

🎯 **Debug Info:** Check console for detailed city detection logs`;
      
      return res.status(200).json({ message: response, success: true });
    }
    
    else {
      // Enhanced context-specific responses with real marketplace insights
      if (userProfile?.user_type === 'buyer') {
        const budgetCars = availableCars.filter(car => car.price_category === 'budget').length;
        const midRangeCars = availableCars.filter(car => car.price_category === 'mid-range').length;
        const premiumCars = availableCars.filter(car => car.price_category === 'premium').length;
        
        response = `🛒 **Buyer Dashboard - Marketplace Assistant**

📊 **Live Marketplace Status:**
• **Total cars:** ${availableCars.length} available
• **Price range:** $${minPrice} - $${maxPrice}
• **Average price:** $${avgPrice}

🎯 **Available by category:**
• **Budget cars (≤$1000):** ${budgetCars} cars
• **Mid-range ($1000-$5000):** ${midRangeCars} cars  
• **Premium ($5000+):** ${premiumCars} cars

💬 **Try asking:**
• "Budget $500 mein kya milega?"
• "Cheapest car recommend karo"
• "Mid-range cars dikhao"
• "Specific car name" (e.g., Toyota, Honda)
• "200 dollar wali car"

🔥 **Pro tip:** Price-specific searches work best!`;
      } else if (userProfile?.user_type === 'seller') {
        const avgDaysListed = availableCars.length > 0 ? Math.round(availableCars.reduce((sum, car) => sum + car.days_since_listed, 0) / availableCars.length) : 0;
        const carsWithPhotos = availableCars.filter(car => car.has_images).length;
        
        response = `💼 **Seller Dashboard - Market Intelligence**

📊 **Competition Analysis:**
• **${availableCars.length} cars** competing with yours
• **Average price:** $${avgPrice}
• **Average listing age:** ${avgDaysListed} days
• **Cars with photos:** ${carsWithPhotos}/${availableCars.length} (${Math.round(carsWithPhotos/availableCars.length*100) || 0}%)

💡 **Smart queries to try:**
• "Market analysis aur tips"
• "Competitive pricing strategy"
• "Average price comparison"
• "Selling tips for quick sale"

🎯 **Market insight:** ${avgPrice < 2000 ? 'Budget cars in high demand' : 'Premium market is active'}`;
      } else {
        // Non-logged in users - Enhanced signup guidance
        const categoryBreakdown = {
          budget: availableCars.filter(car => car.price_category === 'budget').length,
          midRange: availableCars.filter(car => car.price_category === 'mid-range').length,
          premium: availableCars.filter(car => car.price_category === 'premium').length,
          luxury: availableCars.filter(car => car.price_category === 'luxury').length
        };
        
        response = `🏪 **Car Marketplace Assistant** (Guest Mode)

📊 **Live Market Preview:**
• **Total cars:** ${availableCars.length} available
• **Price range:** $${minPrice} - $${maxPrice}
• **Market average:** $${avgPrice}

🎯 **Available Inventory:**
• **Budget (≤$1K):** ${categoryBreakdown.budget} cars
• **Mid-range ($1K-$5K):** ${categoryBreakdown.midRange} cars
• **Premium ($5K-$10K):** ${categoryBreakdown.premium} cars
• **Luxury ($10K+):** ${categoryBreakdown.luxury} cars

💬 **You can ask:**
• "Cheapest car kya hai?"
• "Budget $X mein options?"
• "Premium cars available?"
• "Market status check karo"

🔓 **Unlock Full Features:**
• **Buyer Account:** Personalized recommendations, direct seller contact, budget filtering
• **Seller Account:** List cars, market analytics, pricing strategies, buyer management

🚀 **Ready to join?** 
Ask: "buyer signup", "seller registration", or "account banao"

💡 **Try**: "buy car", "sell car", or "login/signup" for guided setup!`;
      }
    }

    // Final safety check - ensure response is set
    if (!response && (lowerMessage.includes('sell') || lowerMessage.includes('buy') || lowerMessage.includes('tips'))) {
      response = `🤖 **Marketplace Assistant:**

📊 **Live Market Status:**
• **${availableCars.length} cars** available
• **Price range:** $${minPrice} - $${maxPrice}
• **Average price:** $${avgPrice}

💬 **Try asking:**
• "selling tips" - for seller guidance
• "buying tips" - for buyer advice
• "market status" - for current trends
• "cheapest car" - for budget options

🚀 **Need help?** Ask specific questions about buying, selling, or market analysis!`;
    }

    res.status(200).json({ 
      message: response,
      success: true,
      provider: 'marketplace-dynamic',
      stats: {
        totalCars: availableCars.length,
        priceRange: `$${minPrice} - $${maxPrice}`,
        avgPrice: `$${avgPrice}`
      }
    });

  } catch (error) {
    console.error('Marketplace chat error:', error);
    res.status(500).json({ 
      message: 'Marketplace data fetch karne mein issue hai. Thoda wait kar ke try karo.',
      success: false 
    });
  }
} 