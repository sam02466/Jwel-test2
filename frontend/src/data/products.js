const img = (id, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const IMG = {
  ringGold: img('photo-1515562141207-7a88fb7ce338'),
  jewellery1: img('photo-1605100804763-247f67b3557e'),
  diamondRing: img('photo-1599643478518-a784e5dc4c8f'),
  goldNecklace: 'https://images.pexels.com/photos/7134458/pexels-photo-7134458.jpeg',
  earrings: img('photo-1535632066927-ab7c9ab60908'),
  jewellery2: img('photo-1573408301185-9146fe634ad0'),
  rings: img('photo-1512163143273-bde0e3cc7407'),
  jewellery3: img('photo-1506630448388-4e683c67ddb0'),
  bracelets: img('photo-1620656798579-1984d9e87df7'),
  jewellery4: img('photo-1611591437281-460bfbe1220a'),
  gold: img('photo-1611085583191-a3b181a88401'),
  goldJewellery: img('photo-1617038220319-276d3cfab638'),
  bracelet2: img('photo-1602173574767-37ac01994b2a'),
  jewellery5: 'https://images.pexels.com/photos/34511063/pexels-photo-34511063.jpeg',
  jewellery6: img('photo-1611652022419-a9419f74343d'),
  jewellery7: img('photo-1603561591411-07134e71a2a9'),
  jewellery8: 'https://images.pexels.com/photos/10474333/pexels-photo-10474333.jpeg',
  ring2: img('photo-1576566588028-4147f3842f27'),
  rings2: img('photo-1522312346375-d1a52e2b99b3'),
  jewellery9: img('photo-1603974372039-adc49044b6bd'),
  jewellery10: img('photo-1615634260167-c8cdede054de'),
  jewellery11: img('photo-1605721911519-3dfeb3be25e7'),
  jewellery12: img('photo-1560298803-1d998f6b5249'),
  diamond: img('photo-1543294001-f7cd5d7fb516')
}

export const CATEGORIES = [
  {
    name: 'Necklaces',
    tagline: 'Graceful statements for every neckline',
    image: IMG.goldNecklace
  },
  {
    name: 'Earrings',
    tagline: 'From daily studs to bridal jhumkas',
    image: IMG.earrings
  },
  {
    name: 'Rings',
    tagline: 'Solitaires, bands & heirloom stones',
    image: IMG.ringGold
  },
  {
    name: 'Bangles',
    tagline: 'The chime of tradition',
    image: IMG.jewellery4
  },
  {
    name: 'Mangalsutra',
    tagline: 'Sacred symbols of togetherness',
    image: IMG.jewellery5
  },
  {
    name: 'Bracelets',
    tagline: 'Modern elegance on the wrist',
    image: IMG.bracelets
  },
  {
    name: 'Anklets',
    tagline: 'Whispers of delicate beauty',
    image: IMG.jewellery7
  },
  {
    name: 'Kundan Sets',
    tagline: 'Royal bridal opulence',
    image: IMG.jewellery2
  }
]

export const TESTIMONIALS = [
  {
    name: 'Ananya Sharma',
    role: 'Bride, June 2026',
    text: 'The Aadhya bridal set made me feel like royalty on my wedding day. The kundan work is exquisite and it arrived beautifully packed with a certificate.',
    rating: 5
  },
  {
    name: 'Ritika Jain',
    role: 'Frequent customer',
    text: 'Sarika Beauty Hub has become my go-to for festive gifting. The quality is consistent and the packaging alone feels like a gift from a boutique.',
    rating: 5
  },
  {
    name: 'Meghna Kulkarni',
    role: 'Mumbai',
    text: 'Ordered the diamond pendant for my anniversary. Certification, buyback promise, and the most elegant velvet case — everything was flawless.',
    rating: 5
  },
  {
    name: 'Sneha Reddy',
    role: 'Hyderabad',
    text: 'Their delivery team is so professional. I could track my mangalsutra from boutique to doorstep, and the QR receipt made collection effortless.',
    rating: 4.8
  }
]
