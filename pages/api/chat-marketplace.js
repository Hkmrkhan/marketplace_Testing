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
      const { data: cars } = await supabase
        .from('ai_marketplace_data')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(25);

      availableCars = cars || [];
      const prices = availableCars.map(car => car.numeric_price || 0).filter(price => price > 0);
      minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
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

🚀 **[Signup/Login kar ke full marketplace experience enjoy karo!]**`;
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
• Ask: "buyer signup" or "buy car"
• Get personalized recommendations
• Direct seller contact

🏪 **Want to SELL your car?**
• Ask: "seller registration" or "sell car"  
• Market analysis & pricing tips
• Professional listing tools

💬 **Just browsing?**
• Ask: "cheapest car kya hai?"
• Ask: "market status check karo"
• Ask: "budget $500 options?"

🚀 **Ready to start?** Simply type:
"buyer account", "seller account", or "market browse"

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
            
            // Add district info if available
            if (car.reg_district) {
              details += `\n📍 **District:** ${car.reg_district}`;
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
            
            // Add district info if available
            if (car.reg_district) {
              details += `\n📍 **District:** ${car.reg_district}`;
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
            
            // Add district info if available
            if (cheapestAffordable.reg_district) {
              details += `\n📍 **District:** ${cheapestAffordable.reg_district}`;
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
        
        // Add district info if available
        if (cheapestCar.reg_district) {
          details += `\n📍 **District:** ${cheapestCar.reg_district}`;
        }
        
        details += `\n📅 **Listed:** ${cheapestCar.days_since_listed} days ago
📸 **Images:** ${cheapestCar.has_images ? 'Available' : 'Not uploaded'}
📝 **Description:** ${cheapestCar.description?.substring(0, 100) || 'Description not available'}...
📞 **Contact:** ${cheapestCar.seller_whatsapp ? 'WhatsApp available' : 'Use marketplace chat'}

🛒 **Cars page se direct purchase kar sakte hain!**`;
        
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
        
        // Add district info if available
        if (expensiveCar.reg_district) {
          details += `\n📍 **District:** ${expensiveCar.reg_district}`;
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
            
            // Add district info if available
            if (car.reg_district) {
              details += `\n📍 **District:** ${car.reg_district}`;
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
    
    else if (lowerMessage.includes('total') || lowerMessage.includes('kitni cars') || lowerMessage.includes('marketplace status')) {
      const categoryStats = {
        budget: availableCars.filter(car => car.price_category === 'budget').length,
        midRange: availableCars.filter(car => car.price_category === 'mid-range').length,
        premium: availableCars.filter(car => car.price_category === 'premium').length,
        luxury: availableCars.filter(car => car.price_category === 'luxury').length
      };
      const sellersCount = [...new Set(availableCars.map(car => car.seller_id))].length;
      const recentListings = availableCars.filter(car => car.days_since_listed <= 7).length;
      
      response = `📊 **Complete Marketplace Status Report:**

🚗 **Inventory Overview:**
• **Total available cars:** ${availableCars.length}
• **Active sellers:** ${sellersCount}
• **Recent listings (7 days):** ${recentListings}

💰 **Price Analysis:**
• **Range:** $${minPrice} - $${maxPrice}
• **Average:** $${avgPrice}
• **Cheapest option:** $${minPrice}
• **Premium option:** $${maxPrice}

🎯 **Category Breakdown:**
• **Budget cars (≤$1K):** ${categoryStats.budget}
• **Mid-range ($1K-$5K):** ${categoryStats.midRange}
• **Premium ($5K-$10K):** ${categoryStats.premium}
• **Luxury ($10K+):** ${categoryStats.luxury}

📈 **Market Activity:** ${recentListings > availableCars.length * 0.3 ? 'High activity - fresh inventory!' : 'Stable market with quality options'}

💡 **Best time to** ${userProfile?.user_type === 'buyer' ? 'buy - good selection available!' : userProfile?.user_type === 'seller' ? 'sell - active market!' : 'join - active marketplace!'}`;
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