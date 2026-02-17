// lib/multiEateryData.js
export const allEateries = {
  "campus-bites": {
    name: "campus-bites",
    theme: "bg-orange-50",
    menu: [
      {
      "category": "DOSA",
      "headers": ["Plain", "Butter/Cheese", "Ghee"],
      "items": [
        { "name": "PLAIN", "prices": [40, 55, 64] },
        { "name": "MYSORE PLAIN", "prices": [50, 65, 74] },
        { "name": "ANDHRA MIRCHI", "prices": [50, 65, 74] },
        { "name": "PAPER PLAIN", "prices": [50, 65, 74] },
        { "name": "PODI", "prices": [50, 65, 74] },
        { "name": "MASALA", "prices": [55, 70, 79] },
        { "name": "ONION", "prices": [55, 70, 79] },
        { "name": "MYSORE ONION", "prices": [60, 75, 84] },
        { "name": "MYSORE MASALA", "prices": [60, 75, 84] },
        { "name": "PAPER MASALA", "prices": [60, 75, 84] },
        { "name": "EGG", "prices": [60, 75, 84] },
        { "name": "ANDHRA MIRCHI MASALA", "prices": [60, 75, 84] },
        { "name": "GHEE ROAST", "prices": [65, null, null] },
        { "name": "ONION MASALA", "prices": [65, 70, 84] },
        { "name": "EGG MYSORE", "prices": [65, 80, 89] },
        { "name": "EGG PODI", "prices": [65, 80, 89] },
        { "name": "EGG ANDHRA MIRCHI", "prices": [65, 80, 89] },
        { "name": "MYSORE ONION MASALA", "prices": [70, 85, 94] },
        { "name": "PANEER", "prices": [75, 90, 94] },
        { "name": "MYSORE PANEER", "prices": [80, 95, 104] }
      ]
    },
    {
      "category": "RAVA DOSA",
      "headers": ["Plain", "Butter/Cheese", "Ghee"],
      "items": [
        { "name": "PLAIN", "prices": [40, 55, 64] },
        { "name": "MYSORE PLAIN", "prices": [50, 65, 74] },
        { "name": "ANDHRA MIRCHI PLAIN", "prices": [50, 65, 74] },
        { "name": "MASALA", "prices": [55, 70, 79] },
        { "name": "ONION RAVA", "prices": [55, 70, 79] },
        { "name": "MYSORE MASALA", "prices": [60, 75, 84] },
        { "name": "MYSORE ONION", "prices": [60, 75, 84] },
        { "name": "ONION MASALA", "prices": [70, 85, 94] },
        { "name": "MYSORE ONION MASALA", "prices": [70, 85, 94] },
        { "name": "PANEER", "prices": [75, 90, 99] }
      ]
    },
    {
      "category": "UTHAPPAM",
      "headers": ["Plain", "Butter/Cheese", "Ghee"],
      "items": [
        { "name": "PLAIN", "prices": [40, 55, 64] },
        { "name": "PODI", "prices": [50, 65, 74] },
        { "name": "ONION", "prices": [55, 70, 74] },
        { "name": "TOMATO", "prices": [55, 70, 74] },
        { "name": "MASALA", "prices": [55, 70, 74] },
        { "name": "ONION MASALA", "prices": [65, 80, 89] },
        { "name": "ONION TOMATO", "prices": [65, 80, 89] },
        { "name": "ONION TOMATO MASALA", "prices": [70, 85, 94] },
        { "name": "PODI ONION TOMATO", "prices": [70, 85, 94] }
      ]
    },
    {
      "category": "PARATHA 2 (Pcs)",
      "items": [
        { "name": "ALOO", "price": 60 },
        { "name": "GOBI", "price": 60 },
        { "name": "ONION", "price": 60 },
        { "name": "MIX (Aloo & Onion)", "price": 70 },
        { "name": "PANEER", "price": 80 },
        { "name": "MIX (Onion & Paneer)", "price": 90, "extra": "EXTRA BUTTER RS.15 Extra GHEE RS.24" },
        { "name": "POORI SABJI", "price": 50 },
        { "name": "CHOLE BHATURE", "price": 80 }
      ]
    },
    {
      "category": "MAGGI",
      "items": [
        { "name": "PLAIN", "price": 35 },
        { "name": "MASALA", "price": 45 },
        { "name": "FRIED", "price": 44 },
        { "name": "CHEESE", "price": 50 },
        { "name": "MASALA CHEESE", "price": 60 },
        { "name": "FRIED CHEESE", "price": 60 },
        { "name": "PANEER FRIED", "price": 65 },
        { "name": "PANEER FRIED CHEESE", "price": 75 },
        { "name": "CHICKEN", "price": 65 }
      ]
    },
    {
      "category": "BURGER",
      "items": [
        { "name": "VEG", "price": 40 },
        { "name": "VEG CHEESE", "price": 55 },
        { "name": "CHICKEN", "price": 60 },
        { "name": "CHICKEN CHEESE", "price": 70 }
      ]
    },
    {
        category: "OMELET",
        items: [
          { name: "Single Omelet", price: 20 },
          { name: "Single Masala Omelet", price: 25 },
          { name: "Double Omelet", price: 35 },
          { name: "Single Bread Omelet", price: 35 },
          { name: "Double Bread Omelet", price: 50 },
          { name: "Masala Double Bread Omelet", price: 60 }
        ]
      },
      {
        category: "QUICK BITES",
        items: [
          { name: "Veg Patties", price: 20 },
          { name: "Egg Patties", price: 25 },
          { name: "Paneer", price: 25 },
          { name: "Chocolate Donuts", price: 35 },
          { name: "Chicken Patties", price: 35 }
        ]
      },
      {
        category: "SANDWICH",
        items: [
          { name: "Bread Butter", price: 35 },
          { name: "Masala", price: 40 },
          { name: "Plain Cheese", price: 40 },
          { name: "Masala Cheese", price: 55 },
          { name: "Veg (Masala)", price: 50 },
          { name: "Egg", price: 65 },
          { name: "Paneer", price: 65 },
          { name: "Chicken", price: 70 }
        ]
      },
      {
        category: "FRANKIES",
        items: [
          { name: "Veg Frankie", price: 40 },
          { name: "Egg Frankie", price: 45 },
          { name: "Paneer Frankie", price: 50 },
          { name: "Chicken Frankie", price: 60 }
        ]
      },
      {
        category: "FRESH FRUIT JUICE",
        items: [
          { name: "Mosambi", price: 48 },
          { name: "Orange", price: 48 },
          { name: "Water Melon", price: 48 },
          { name: "Pineapple", price: 48 }
        ]
      },
      {
        category: "MILK SHAKES",
        items: [
          { name: "Banana", price: 48 },
          { name: "Badam", price: 54 },
          { name: "Oreo", price: 58 },
          { name: "Apple", price: 60 },
          { name: "Annar", price: 60 },
          { name: "Coffee Oreo", price: 65 }
        ]
      },
      {
        category: "HOT BEVERAGES",
        items: [
          { name: "Coffee", price: 15 },
          { name: "Tea", price: 15 },
          { name: "Black Tea", price: 15 },
          { name: "Black Coffee", price: 15 },
          { name: "Hot Bournvita", price: 40 },
          { name: "Hot Boost", price: 40 },
          { name: "Hot Horlicks", price: 40 },
          { name: "Hot Badam", price: 40 }
        ]
      },
      {
        category: "COLD BEVERAGES",
        items: [
          { name: "Cold Coffee", price: 45 },
          { name: "Cold Bournvita", price: 45 },
          { name: "Cold Boost", price: 45 },
          { name: "Cold Horlicks", price: 45 },
          { name: "Rose Milk", price: 45 }
        ]
      }
    ]
  },
  "bits-canteen": {
    name: "BITS Canteen",
    theme: "bg-blue-50",
    menu: [
      {
        category: "BEVERAGES",
        items: [
          { name: "TEA", price: 10 },
          { name: "COFFEE", price: 15 }
        ]
      }
    ]
  }
};