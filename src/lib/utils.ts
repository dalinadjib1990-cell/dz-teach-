import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const playNotificationSound = (type: 'message' | 'notification' | 'call') => {
  const sounds = {
    message: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
    notification: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
    call: 'https://assets.mixkit.co/active_storage/sfx/135/135-preview.mp3'
  };
  
  const audio = new Audio(sounds[type]);
  audio.play().catch(e => console.log('Audio play blocked', e));
};
