import { create } from 'zustand';

interface SignupState {
  interests: string[];
  setInterests: (interests: string[]) => void;
  toggleInterest: (interest: string) => void;
}

export const useSignupStore = create<SignupState>((set) => ({
  interests: [],
  setInterests: (interests) => set({ interests }),
  toggleInterest: (interest) => set((state) => ({
    interests: state.interests.includes(interest)
      ? state.interests.filter((i) => i !== interest)
      : [...state.interests, interest],
  })),
}));