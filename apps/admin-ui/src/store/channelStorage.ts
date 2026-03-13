import { create } from 'zustand';

interface ChannelState {
    channelId: string;
    setChannel: (channelId: string) => void;
}

export const useChannelStore = create<ChannelState>((set) => (
    {
        channelId: '',
        setChannel: (id) => set({ channelId: id }),
    }
)
);