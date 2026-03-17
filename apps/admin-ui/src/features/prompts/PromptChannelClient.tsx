'use client'
import { useState, useEffect, useMemo } from 'react';
import { useChannelStore } from '@/store/channelStorage';
import { createPrompt, getPrompts, updatePrompt } from './api';
import { Button } from 'react-bootstrap';
import { PromptDto } from './type';
export function PromptChannelClient() {

    const [prompts, setPrompts] = useState<PromptDto[]>([]);
    const [channelId, setChannelId] = useState<string>("")
    const [name, setName] = useState<string>("")
    const [prompt, setPrompt] = useState<string>("")
    // const channelId = useMemo(() => useChannelStore.getState().channelId, [useChannelStore.getState().channelId])
    useEffect(() => {
        (async () => {
            const id = useChannelStore.getState().channelId
            setChannelId(id)
            const res = await getPrompts(id)
            setPrompts(res)
        })()
    }, [])

    function addForm() {
        const newPrompt: PromptDto = {
            channelId,
            name: "",
            prompt: "",
        };
        const newPrompts = [newPrompt, ...prompts];
        setPrompts(newPrompts)

    }

    async function savePrompt(p: PromptDto) {
        const namePrompt = p.name.toLocaleLowerCase().trim().replaceAll(" ", "_")
        p.name = namePrompt

        if (!p.id) {
            const createdPrompt = await createPrompt({
                channelId,
                name: namePrompt,
                prompt: p.prompt
            });
            p.id = createdPrompt.id;

        } else {

            await updatePrompt(p);
        }
        setPrompts([...prompts])

    }

    function changeName(text: string, p: PromptDto) {
        p.name = text;
        setPrompts([...prompts])
    }
    function changePrompt(text: string, p: PromptDto) {
        p.prompt = text;
        setPrompts([...prompts])
    }

    return (
        <div className='mt-5'>
            <div className='card'>
                <div className='card-header'>

                    <div className='d-flex align-items-center justify-content-between'>
                        <h5 className='mb-0'>Prompts</h5>
                        <button className='btn btn-sm btn-primary' onClick={addForm}>
                            Add Prompt
                        </button>
                    </div>
                </div>
                <div className='card-body'>
                    {prompts.map((p, index) => (
                        <div key={index} className='mt-3'>
                            <div className='d-flex'>
                                <input
                                    type="text"
                                    className='d-block w-100 mt-3 me-2'
                                    value={p.name}
                                    onChange={(e) => changeName(e.target.value, p)}
                                />
                                <Button variant='outline-info' className='mt-3' onClick={() => savePrompt(p)}>
                                    Save
                                </Button>
                            </div>

                            <textarea className='d-block w-100 mt-2' style={{ height: !p.id ? 150 : 50 }}
                                value={p.prompt}
                                onChange={(e) => changePrompt(e.target.value, p)}
                            />

                            <hr className='mt-4' />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}