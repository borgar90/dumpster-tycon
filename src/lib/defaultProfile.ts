const STARTER_AVATARS = ['🗑️', '🦝', '🛒', '🔦', '⚙️', '📦'];

export const normalizeUsernameBase = (value: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 18);

  return normalized || 'scavenger';
};

export const pickStarterAvatar = (seed: string) => {
  const sum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return STARTER_AVATARS[sum % STARTER_AVATARS.length];
};

export const createStarterProfileData = (displayName: string) => ({
  displayName,
  avatar: pickStarterAvatar(displayName),
  rank: 1,
  reputation: 0,
  cash: 250,
  heat: 0,
  energy: 100,
  maxEnergy: 100,
  inventoryCapacity: 100,
  usedCapacity: 0,
  currentDistrict: 'slums',
  currentPage: 'city',
  totalScavenged: 0,
  inventoryJson: '[]',
  equipmentJson: JSON.stringify({
    cart: null,
    backpack: null,
    flashlight: null,
    gloves: null,
  }),
  settingsJson: JSON.stringify({
    tutorialSeen: false,
    notifications: true,
    theme: 'neon',
    itemsFound: 0,
    sessionStreak: 1,
    lastActiveDate: null,
  }),
});
