"use client";
import { Collapse, Button, Form, Badge, Toast, Modal } from 'react-bootstrap';
import { useEffect, useMemo, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { apiUpload, createChannel } from '../api';
import { ChannelDto } from '../type';

export function ModalChannel({
    show,
    edit,
    channel,
    handleClose,
}: { show: boolean, edit: boolean,channel:ChannelDto, handleClose: () => void }) {
    const [open, setOpen] = useState(false);
    const [character, setCharacter] = useState('');
    const [persona, setPersona] = useState('');
    const [pipeline, setPipeline] = useState('');
    const [style_rules, setStyle_rules] = useState('');
    const [channelName, setChannelName] = useState('')
    const [image, setImage] = useState('')
    const [id, setId] = useState('')
    const [file, setFile] = useState(null)
    const fileTypes = ["PNG"];


    const openModelChannel = () => {
        setOpen(true)
    }

    const handleChange = (f: any) => {
        console.log(f)
        setFile(f);
    };



    useEffect(() => {
        setChannelName(channel.name)
        setCharacter(channel.character)
        setImage(channel.image)
        setPersona(channel.persona)
        setPipeline(channel.pipeline)
        setStyle_rules(channel.style_rules)
        setOpen(show)
    })
    async function saveChannel() {
        let url = image
        if (file != null) {
            const uploadRes = await apiUpload(file) as any;
            if (uploadRes.status) {
                url = uploadRes.url
                setImage(uploadRes.url)
            }
        }
        const res = await createChannel({
            name: channelName,
            image: url,
            character,
            persona,
            pipeline,
            style_rules,
            id,
        })

        console.log(res)

        handleClose()
    }

    return (
        <Modal show={show} onHide={handleClose} size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered>
            <Modal.Header closeButton>
                <Modal.Title>{edit ? 'Create Channel' : 'Edit Channel'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-3"><b>Name</b></div>
                        <div className="col-9">
                            <input
                                className="form-control bg-black border-0 text-white"
                                placeholder="Channel Name"
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                            />
                        </div>

                        <div className="col-3"><b>Image</b></div>
                        <div className="col-9">
                            <div className='d-flex'>{
                                image != '' ? <img src={`/api${image}`} className='me-2' style={{width:80, height: 'auto'}} />
                                    :
                                    <></>
                            }
                                <FileUploader handleChange={handleChange} name="file" types={fileTypes} />
                            </div>
                        </div>

                        <div className="col-3"><b>Character</b></div>
                        <div className="col-9">
                            <textarea
                                className="form-control mt-2"
                                style={{ minHeight: 50 }}
                                value={character}
                                onChange={(e) => setCharacter(e.target.value)}
                            />
                        </div>

                        <div className="col-3"><b>Persona</b></div>
                        <div className="col-9">
                            <textarea
                                className="form-control mt-2"
                                style={{ minHeight: 50 }}
                                value={persona}
                                onChange={(e) => setPersona(e.target.value)}
                            />
                        </div>

                        <div className="col-3"><b>Pipeline</b></div>
                        <div className="col-9">
                            <textarea
                                className="form-control mt-2"
                                style={{ minHeight: 50 }}
                                value={pipeline}
                                onChange={(e) => setPipeline(e.target.value)}
                            />
                        </div>

                        <div className="col-3"><b>Style rules</b></div>
                        <div className="col-9">
                            <textarea
                                className="form-control mt-2"
                                style={{ minHeight: 50 }}
                                value={style_rules}
                                onChange={(e) => setStyle_rules(e.target.value)}
                            />
                        </div>

                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={saveChannel}>
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    )
}