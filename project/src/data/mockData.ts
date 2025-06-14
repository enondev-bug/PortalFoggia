export interface Business {
  id: number;
  name: string;
  description: string;
  category: string;
  address: string;
  hours: string;
  rating: number;
  image: string;
  isOpen: boolean;
  featured: boolean;
  currentOffer?: string;
}

export const mockBusinesses: Business[] = [
  {
    id: 1,
    name: 'Pizzeria Roma',
    description: 'Autentica pizzeria napoletana nel cuore di Milano. Offriamo pizze tradizionali cotte nel forno a legna, con ingredienti freschi e di qualità.',
    category: 'Ristoranti',
    address: 'Via Giuseppe Garibaldi, 15, Milano',
    hours: '12:00-14:30, 19:00-23:30',
    rating: 4.8,
    image: 'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=800',
    isOpen: true,
    featured: true,
    currentOffer: 'Happy Hour Pizza - 20% di sconto dalle 18:00 alle 20:00'
  }
];