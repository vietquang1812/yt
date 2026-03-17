export type PromptDto = {
    id: string;
    channelId: string;
    name: string;
    prompt?: string;
    createdAt: string;
    updatedAt: string;
}
export type CreatePromptDto = {
    channelId: string;
    name: string;
    prompt?: string;
    createdAt: string;
    updatedAt: string;
}