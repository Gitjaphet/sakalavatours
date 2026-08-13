export const navLinks = [
  { key: "tours", href: "/tours" },
  { key: "excursion", href: "/excursion" },
  { key: "apropos", href: "/a-propos" },
  { key: "blog", href: "/blog" },
  { key: "galerie", href: "/galerie" },
  { key: "contact", href: "/contact" },
] as const;

// Sous-ensemble affiché dans le pill compact au scroll (desktop)
export const compactNavKeys = ["tours", "excursion", "blog", "contact"] as const;

export const contactInfo = {
  phone: "0322208362",
  phoneDisplay: "+261 32 22 083 62",
  email: "sakalavatour@gmail.com",
  hours: "Lun–Sam, 8h–18h",
};

export const socialLinks = [
  { key: "facebook", href: "https://facebook.com/sakalavatours", icon: "brand-facebook" },
  { key: "instagram", href: "https://instagram.com/sakalavatours", icon: "brand-instagram" },
  { key: "whatsapp", href: `https://wa.me/${contactInfo.phone}`, icon: "brand-whatsapp" },
] as const;