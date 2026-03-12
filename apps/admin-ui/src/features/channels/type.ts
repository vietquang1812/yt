export type ChannelDto = {
    id: string;
    name: string;
    image: string;
    character: string;
    persona: string;
    pipeline: string;
    style_rules: string;
    createdAt?: string;
    updatedAt?: string;
    projects?: [];
    channelPrompts?: [];
};

export type ChannelPromptDto = {
    id: string;
    name: string;
    prompt: string;

    createdAt: string;
    updatedAt: string;

    channelId: string;
    channels: string;

}

