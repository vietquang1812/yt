"use client";
import { useEffect, useState } from "react";
import { getChannels } from "./api";
import { ChannelDto } from "./type";
import { Button } from 'react-bootstrap';
import { ModalChannel } from "./components/modal_channel";
import Link from "next/link";

export function ChannelPageClient() {
    const [channels, setChannels] = useState<ChannelDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('')
    const [ok, setOk] = useState(false)
    const [open, setOpen] = useState(false);
    const [edit, setEdit] = useState(false);
    const [channelForm, setChannelForm] = useState<ChannelDto>({
        id: '',
        name: '',
        image: '',
        character: '',
        persona: '',
        pipeline: '',
        style_rules: ''
    })

    async function refresh() {
        setLoading(true);
        setErr('');
        setOk(false);

        try {
            const s = await getChannels();
            console.log(s)
            setChannels(s)
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, [])

    const openModelChannel = (id: string) => {
        const emptyChannel = {
            id: '',
            name: '',
            image: '',
            character: '',
            persona: '',
            pipeline: '',
            style_rules: ''
        }
        if (id === '') {
            setChannelForm(emptyChannel)
        } else {
            const channel = channels.find((c: ChannelDto) => c.id === id)
            if (channel) {
                setChannelForm(channel)
            } else {
                setChannelForm(emptyChannel)
            }
        }
        setOpen(true)
    }

    const saveChannel = () => {

    }
    const handleClose = () => {
        setOpen(false)
    }

    return (
        <div className="container">
            <div className="d-flex justify-content-end mb-4 mt-5">
                <Button
                    key={'channel'}
                    onClick={() => openModelChannel('')}
                    aria-controls="example-collapse-text"
                    aria-expanded={open}
                    variant={"success"}
                    className='text-start'
                >
                    Create
                </Button>
            </div>
            <div className="card">
                <div className="card-header">
                    <h1 className="h4">Channel</h1>
                </div>
                <div className="card-body">
                    {
                        err !== '' ?
                            <h4 className="h4 text-danger">{err}</h4>
                            :

                            (
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            loading ?
                                                (<tr><td colSpan={3}>Loading...</td></tr>) :
                                                channels.map((c: ChannelDto, index: number) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td><Link className=" ms-2" href={`/channels/${c.id}`}>{c.name}</Link></td>
                                                        <td>
                                                            <Button
                                                                key={'channel'}
                                                                onClick={() => openModelChannel(c.id)}
                                                                aria-controls="example-collapse-text"
                                                                aria-expanded={open}
                                                                variant={"info"}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))

                                        }
                                    </tbody>
                                </table>
                            )}
                </div>
            </div>

            <ModalChannel show={open} edit={edit} channel={channelForm} handleClose={handleClose} />
        </div>
    )
}