export type AvatarGender = 'male' | 'female';

export interface Avatar {
  id: string;
  gender: AvatarGender;
  label: string;
  url: string;
}

/**
 * Predefined avatars from Avatar Placeholder API
 * https://avatar-placeholder.iran.liara.run
 */
export const AVATARS: Avatar[] = [
  // Female avatars
  {
    id: '70',
    gender: 'female',
    label: 'Smiling avatar 1',
    url: 'https://avatar.iran.liara.run/public/70',
  },
  {
    id: '64',
    gender: 'female',
    label: 'Friendly avatar 2',
    url: 'https://avatar.iran.liara.run/public/64',
  },
  {
    id: '78',
    gender: 'female',
    label: 'Happy avatar 3',
    url: 'https://avatar.iran.liara.run/public/78',
  },
  {
    id: '92',
    gender: 'female',
    label: 'Cheerful avatar 4',
    url: 'https://avatar.iran.liara.run/public/92',
  },
  {
    id: '85',
    gender: 'female',
    label: 'Bright avatar 5',
    url: 'https://avatar.iran.liara.run/public/85',
  },
  // Male avatars
  {
    id: '46',
    gender: 'male',
    label: 'Smiling avatar 1',
    url: 'https://avatar.iran.liara.run/public/46',
  },
  {
    id: '34',
    gender: 'male',
    label: 'Friendly avatar 2',
    url: 'https://avatar.iran.liara.run/public/34',
  },
  {
    id: '39',
    gender: 'male',
    label: 'Happy avatar 3',
    url: 'https://avatar.iran.liara.run/public/39',
  },
  {
    id: '21',
    gender: 'male',
    label: 'Cheerful avatar 4',
    url: 'https://avatar.iran.liara.run/public/21',
  },
  {
    id: '8',
    gender: 'male',
    label: 'Bright avatar 5',
    url: 'https://avatar.iran.liara.run/public/8',
  },
];

/**
 * Get avatars filtered by gender
 */
export const getAvatarsByGender = (gender: AvatarGender): Avatar[] => {
  return AVATARS.filter((avatar) => avatar.gender === gender);
};

/**
 * Find an avatar by its URL
 */
export const findAvatarByUrl = (url: string): Avatar | undefined => {
  return AVATARS.find((avatar) => avatar.url === url);
};

/**
 * Get the default avatar (first female avatar)
 */
export const getDefaultAvatar = (): Avatar => {
  return AVATARS[0]; // First female avatar (ID 70)
};
