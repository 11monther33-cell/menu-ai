export interface VisionoPlan {
  id: string;
  name: string;
  price: number; // monthly equivalent price
  currency: string;
  features: string[];
  target: string;
  message?: string;
  highlight?: string;
  popular?: boolean;
}

export const VisionoCatalog: VisionoPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 9, // OMR or USD equivalent based on currency
    currency: "OMR",
    target: "Small Cafes & Kiosks",
    message: "Perfect for getting started with basic POS.",
    features: [
      "Cloud POS & Accounting",
      "1 Supported Branch",
      "Standard Support"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    currency: "OMR",
    target: "Restaurants & Multi-branch",
    message: "Advanced features for growing restaurants.",
    highlight: "Includes WhatsApp AI",
    popular: true,
    features: [
      "Cloud POS & Accounting",
      "Up to 3 Supported Branches",
      "3D/AR Dish Models",
      "WhatsApp AI Sales Assistant",
      "Priority Support"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 49,
    currency: "OMR",
    target: "Large Chains & Franchises",
    message: "Ultimate package for large operations.",
    features: [
      "Cloud POS & Accounting",
      "Unlimited Branches",
      "3D/AR Dish Models",
      "WhatsApp AI Sales Assistant",
      "Loyalty & Marketing Campaigns",
      "Custom API Access",
      "24/7 Dedicated Manager"
    ]
  }
];
