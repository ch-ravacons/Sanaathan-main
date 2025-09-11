// Content moderation utilities for spiritual platform
const inappropriateWords = [
  // Add inappropriate words that should be flagged
  'hate', 'violence', 'abuse', 'attack', 'stupid', 'idiot', 'fool',
  // Religious intolerance terms
  'fake', 'false religion', 'cult', 'brainwash',
];

const spiritualKeywords = [
  'dharma', 'karma', 'moksha', 'yoga', 'meditation', 'bhakti', 'devotion',
  'scripture', 'vedas', 'upanishads', 'gita', 'om', 'namaste', 'peace',
  'wisdom', 'enlightenment', 'spiritual', 'divine', 'sacred', 'holy',
  'temple', 'prayer', 'mantra', 'chanting', 'pilgrimage', 'guru',
  'consciousness', 'awareness', 'truth', 'love', 'compassion', 'ahimsa',
];

export const moderateContent = (content: string): {
  isAppropriate: boolean;
  score: number;
  flags: string[];
  suggestions?: string[];
} => {
  const flags: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  const lowerContent = content.toLowerCase();

  // Check for inappropriate content
  inappropriateWords.forEach(word => {
    if (lowerContent.includes(word)) {
      flags.push(`Contains potentially inappropriate language: "${word}"`);
      score -= 15;
    }
  });

  // Check for spiritual content (positive scoring)
  spiritualKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      score += 3;
    }
  });

  // Check for excessive caps (shouting)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.3 && content.length > 20) {
    flags.push('Excessive use of capital letters');
    suggestions.push('Consider using normal case for better readability');
    score -= 5;
  }

  // Check for minimum meaningful content
  if (content.trim().length < 10) {
    flags.push('Content too short for meaningful discussion');
    score -= 10;
  }

  // Check for questions (encourage discussion)
  if (content.includes('?')) {
    score += 5;
  }

  // Check for personal experience sharing
  const experienceWords = ['experience', 'journey', 'learned', 'realized', 'felt', 'discovered'];
  experienceWords.forEach(word => {
    if (lowerContent.includes(word)) {
      score += 3;
    }
  });

  // Check for respectful language
  const respectfulWords = ['please', 'thank', 'grateful', 'blessed', 'humble', 'respect'];
  respectfulWords.forEach(word => {
    if (lowerContent.includes(word)) {
      score += 2;
    }
  });

  const isAppropriate = flags.length === 0 && score >= -5;

  return {
    isAppropriate,
    score,
    flags,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
};

export const generateContentSuggestions = (topic: string): string[] => {
  const suggestions: Record<string, string[]> = {
    'meditation': [
      'Share your daily meditation practice',
      'Discuss different meditation techniques',
      'Ask about overcoming meditation challenges',
    ],
    'bhakti': [
      'Share a meaningful devotional experience',
      'Discuss your favorite bhajans or kirtans',
      'Ask about developing deeper devotion',
    ],
    'yoga': [
      'Share insights from your yoga practice',
      'Discuss the spiritual aspects of asanas',
      'Ask about integrating yoga philosophy in daily life',
    ],
    'dharma': [
      'Discuss ethical dilemmas and dharmic solutions',
      'Share how you apply dharma in daily decisions',
      'Ask for guidance on righteous living',
    ],
  };

  return suggestions[topic] || [
    'Share your spiritual insights and experiences',
    'Ask thoughtful questions to learn from the community',
    'Discuss how ancient wisdom applies to modern life',
  ];
};