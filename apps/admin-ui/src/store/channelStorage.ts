import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ChannelState {
    channelId: string;
    setChannel: (channelId: string) => void;
}

export const useChannelStore = create<ChannelState>()(
  persist(
    (set) => ({
      channelId: '',
      setChannel: (channelId) => set({ channelId }),
    }),
    {
      name: 'channel-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
