export const TELEGRAM_AGENT = 'Munnapm70045';

export const TYPE_COLORS = {
  APKMOD:      '#ff6600',
  ROOT:        '#ff2200',
  iOS:         '#aaaaaa',
  PC:          '#ffcc00',
  'APK+ROOT':  '#ff6600',
  'ROOT/PC':   '#ffcc00',
  'PC+BYPASS': '#ff9900',
  BLUE:        '#0099ff',
  ORANGE:      '#ff8800',
};

export const PRODUCTS = [
  {
    id: 'drip-client', name: 'DRIP CLIENT', icon: '🔥', color: '#ff6600', badge: null,
    types: {
      APKMOD: [
        { label: '1 Day',   price: 36  },
        { label: '3 Days',  price: 67  },
        { label: '7 Days',  price: 135 },
        { label: '15 Days', price: 225 },
        { label: '30 Days', price: 315 },
      ],
      ROOT: [
        { label: '1 Day',   price: 45  },
        { label: '7 Days',  price: 135 },
        { label: '30 Days', price: 315 },
      ],
    },
  },
  {
    id: 'hg-cheats', name: 'HG CHEATS', icon: '🎮', color: '#00cc44', badge: null,
    types: {
      'APK+ROOT': [
        { label: '1 Day',   price: 67  },
        { label: '7 Days',  price: 112 },
        { label: '10 Days', price: 135 },
        { label: '30 Days', price: 270 },
      ],
    },
  },
  {
    id: 'prime-mods', name: 'PRIME MODS', icon: '💜', color: '#9933ff', badge: null,
    types: {
      APKMOD: [
        { label: '1 Day',  price: 34  },
        { label: '3 Days', price: 68  },
        { label: '7 Days', price: 135 },
      ],
    },
  },
  {
    id: 'pato-teem', name: 'PATO TEEM', icon: '💎', color: '#0099ff', badge: 'PREMIUM',
    colorByType: { BLUE: '#0099ff', ORANGE: '#ff8800' },
    types: {
      BLUE: [
        { label: '3 Days',  price: 90  },
        { label: '7 Days',  price: 180 },
        { label: '15 Days', price: 225 },
        { label: '30 Days', price: 360 },
      ],
      ORANGE: [
        { label: '1 Day',   price: 90  },
        { label: '3 Days',  price: 135 },
        { label: '7 Days',  price: 180 },
        { label: '15 Days', price: 270 },
        { label: '30 Days', price: 450 },
      ],
    },
  },
  {
    id: 'br-mods', name: 'BR MODS', icon: '💎', color: '#ff00aa', badge: 'PREMIUM',
    types: {
      ROOT: [
        { label: '1 Day',   price: 32  },
        { label: '7 Days',  price: 68  },
        { label: '15 Days', price: 135 },
        { label: '30 Days', price: 270 },
      ],
      PC: [
        { label: '1 Day',   price: 54  },
        { label: '10 Days', price: 225 },
        { label: '30 Days', price: 360 },
      ],
      'PC+BYPASS': [
        { label: '1 Day',   price: 81  },
        { label: '10 Days', price: 360 },
        { label: '30 Days', price: 450 },
      ],
    },
  },
  {
    id: 'haxx-cker', name: 'HAXX CKER PRO', icon: '🔒', color: '#ff2200', badge: null,
    types: {
      ROOT: [
        { label: '10 Days', price: 360  },
        { label: '20 Days', price: 720  },
        { label: '30 Days', price: 1080 },
      ],
    },
  },
  {
    id: 'lk-team', name: 'LK TEAM', icon: '💻', color: '#ffcc00', badge: null,
    types: {
      'ROOT/PC': [
        { label: '1 Day',   price: 36  },
        { label: '5 Days',  price: 56  },
        { label: '10 Days', price: 90  },
        { label: '30 Days', price: 225 },
      ],
    },
  },
  {
    id: 'stricks-br', name: 'STRICKS BR', icon: '🎯', color: '#00ff66', badge: null,
    types: {
      ROOT: [
        { label: '1 Day',   price: 22  },
        { label: '5 Days',  price: 45  },
        { label: '7 Days',  price: 90  },
        { label: '15 Days', price: 180 },
        { label: '30 Days', price: 270 },
      ],
    },
  },
  {
    id: 'spotify-ff', name: 'SPOTIFY FF', icon: '🎵', color: '#1db954', badge: null,
    types: {
      ROOT: [
        { label: '7 Days',  price: 135 },
        { label: '15 Days', price: 225 },
        { label: '30 Days', price: 315 },
        { label: '60 Days', price: 540 },
      ],
    },
  },
  {
    id: 'drip-aimkill', name: 'DRIP AIMKILL X86', icon: '🖥️', color: '#ff4400', badge: null,
    types: {
      PC: [
        { label: '1 Day',   price: 112 },
        { label: '7 Days',  price: 270 },
        { label: '15 Days', price: 360 },
        { label: '30 Days', price: 630 },
      ],
    },
  },
  {
    id: 'esign-cert', name: 'iOS / ESIGN CERT', icon: '🍎', color: '#aaaaaa', badge: null,
    types: {
      iOS: [
        { label: '30 Days', price: 270 },
        { label: '60 Days', price: 360 },
        { label: '90 Days', price: 450 },
      ],
    },
  },
  {
    id: 'fluorite-ff', name: 'FLUORITE FF', icon: '🍎', color: '#ff4488', badge: 'HOT',
    types: {
      iOS: [
        { label: '1 Day',   price: 225  },
        { label: '7 Days',  price: 540  },
        { label: '31 Days', price: 1125 },
      ],
    },
  },
];
