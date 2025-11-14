export const loveQuotes = [
  "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.",
  "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.",
  "The best thing to hold onto in life is each other.",
  "Love is composed of a single soul inhabiting two bodies.",
  "You are my today and all of my tomorrows.",
  "Every love story is beautiful, but ours is my favorite.",
  "I love you more than I have ever found a way to say to you.",
  "Together is a wonderful place to be.",
  "You're my favorite notification.",
  "Love grows more tremendously full, swift, poignant, as the years multiply.",
  "The best love is the kind that awakens the soul and makes us reach for more.",
  "I have found the one whom my soul loves.",
  "Love is friendship that has caught fire.",
  "Where there is love, there is life.",
  "Love is the greatest adventure.",
  "You are my sunshine on a cloudy day.",
  "Love recognizes no barriers.",
  "In you, I've found the love of my life and my closest, truest friend.",
  "Life is better with you by my side.",
  "You make my heart smile.",
  "Love is being stupid together.",
  "With you, every moment is a sweet moment.",
  "I choose you. And I'll choose you over and over and over.",
  "You are my favorite place to go when my mind searches for peace.",
  "Love is the bridge between two hearts.",
  "Forever is a long time, but I wouldn't mind spending it by your side.",
  "You are my happy place.",
  "The greatest thing you'll ever learn is just to love and be loved in return.",
  "My heart is perfect because you are inside.",
  "Love is not finding someone to live with. It's finding someone you can't live without.",
  "You're the reason I believe in love.",
  "Every moment spent with you is a moment I treasure.",
  "Love is when the other person's happiness is more important than your own.",
  "You're my definition of perfect.",
  "The smallest act of kindness is worth more than the grandest intention.",
  "Love isn't something you find. Love is something that finds you.",
  "You are my favorite kind of magic.",
  "In your smile, I see something more beautiful than the stars.",
  "Life with you is an endless adventure.",
  "You're the peanut butter to my jelly.",
];

export const getRandomQuote = (): string => {
  return loveQuotes[Math.floor(Math.random() * loveQuotes.length)];
};

export const getQuoteOfTheDay = (): string => {
  // Get a consistent quote for the day based on the date
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % loveQuotes.length;
  return loveQuotes[index];
};
