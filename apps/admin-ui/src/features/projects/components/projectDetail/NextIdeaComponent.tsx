"use client";
import { useState, useEffect } from 'react';
import { BsArrowUpCircleFill } from "react-icons/bs";
import { Collapse, Button, Form, Table, Modal } from 'react-bootstrap';
import { CreateProjectDto } from '../../types';
import { createProject, savePromptPack } from '../../api';
import { createSeries, getSeries } from '@/features/series/api';
import { SeriesDto } from '@/features/series/types';

export function NextIdeaComponent({ project, }: {
    project: any
}) {
    const [open, setOpen] = useState(true);
    const [reset, setReset] = useState(true);
    const [series, setSeries] = useState<SeriesDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState(false);
    const [showUpload, setShowUpload] = useState(false); 
    const [bibleText, setBibleText] = useState('');
    const [name, setName] = useState('');
    const [exist, setExist] = useState(true);
    const [file, setFile] = useState(null);
    const handleClose = () => setShow(false);

    const handleChange = (file : any) => {
        setFile(file);
    };
    async function refresh() {
        setLoading(true);
        try {
            setSeries(await getSeries(project.channel_id));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, [project])

    async function toProject(idea: any) {
        const seriesId = series.find((s: SeriesDto) => s.name === idea.series?.name)?.id
        if (!seriesId) {
            alert('Series not found for idea: ' + idea.series?.name);
            return;
        }
        const body: CreateProjectDto = {
            topic: idea.topic,
            pillar: idea.pillar,
            seriesId: seriesId,
            continuityMode: idea.continuity || "light",
            channelId: project.channelId,
            language: "en",
            durationMinutes: idea.duration_minutes || 6,
            format: "youtube_long",
            tone: idea.tone,
        };

        try {
            await createProject(body);
            idea.exist = true;
            await savePromptPack(project.id, JSON.stringify(project.prompt_pack_json, null, 2));  
            alert('Project created for idea: ' + idea.topic);
            setReset(!reset);
        } catch (error) {
            alert('Failed to create project: ' + error);
        }
    }

    function handleShow(s: any) {
        const item = series.find((i: SeriesDto) => i.name === s.name)
        if (exist) {
            setExist(true)
            setName(item?.name as string);
            setBibleText(JSON.stringify(item?.bible, null, 2));
        } else {
            setExist(false)
            setName('');
            setBibleText('');
        }

        setShow(true)
    }

    async function saveSeries() {
        const item = series.find((i: SeriesDto) => i.name === name)
        let bible: any;
        try {
            bible = JSON.parse(bibleText);
        } catch (e: any) {
            alert('Bible JSON không hợp lệ. Hãy kiểm tra dấu phẩy/ngoặc.')
            return;
        }

        if (exist) {

        } else {
            try {
                await createSeries({ name: name.trim(), bible });
                setName("");
                setBibleText("");
                await refresh();
            } catch (e: any) {
                alert('Bible JSON không hợp lệ. Hãy kiểm tra dấu phẩy/ngoặc.')
            }
        }
    }

    if (!project.hasOwnProperty('topic')) return (<></>)
    if (!project.prompt_pack_json || !project.prompt_pack_json.next_ideas) return (<></>)
    return (
        <div className="card mt-5">
            <div className="card-header">
                <Button
                    key={'project-' + project.id}
                    onClick={() => setOpen(!open)}
                    aria-controls="example-collapse-text"
                    aria-expanded={open}
                    variant={"link"}
                    className='w-100 text-start  text-decoration-none'
                >
                    <div className='d-flex d-flex justify-content-between align-item-center'>
                        <h1 className="h4 mt-2 mb-1">Next Ideas </h1>
                        <h2 style={{
                            transform: `rotate(${open ? 0 : '180deg'})`,
                            transition: 'transform ease-in-out .3s', fontSize: 44,
                        }}><BsArrowUpCircleFill /></h2>

                    </div>
                </Button>
            </div>
            <div className='card-body'>
                <Collapse in={open} key={1}  >
                    <div>
                        <Table striped>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Topic</th>
                                    <th>Tone</th>
                                    <th>Pillar</th>
                                    <th>Continuity</th>
                                    <th>Series</th>
                                    <th>Duration</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    loading ?
                                        (
                                            <tr>
                                                <td colSpan={8}>loading....</td>
                                            </tr>
                                        )
                                        :
                                        project.prompt_pack_json.next_ideas.map((idea: any, index: number) => (
                                            <tr key={index}>
                                                <td>{index+1}</td>
                                                <td>{idea.topic}</td>
                                                <td>{idea.tone}</td>
                                                <td>{idea.pillar}</td>
                                                <td>{idea.continuity}</td>
                                                <td>
                                                    <Button variant="link" onClick={() => handleShow(idea.series)}>
                                                        {idea.series.name}
                                                    </Button>

                                                </td>
                                                <td>{idea.duration_minutes}</td>
                                                <td>
                                                    <Button
                                                        key={'idea-' + index}
                                                        onClick={() => toProject(idea)}
                                                        aria-controls="example-collapse-text"
                                                        aria-expanded={false}
                                                        variant={"info"}
                                                        disabled={idea.exist}
                                                    >
                                                        {idea.exist ? "Done" : "Project"}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                }

                            </tbody>
                        </Table>
                    </div>
                </Collapse>
            </div>
            <Modal show={show} onHide={handleClose} size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered>
                <Modal.Header closeButton>
                    <Modal.Title>Create Series</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-12 col-lg-4">
                                <label className="form-label">Name</label>
                                <input
                                    className="form-control bg-black text-white border-secondary"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Simple Mind Studio - Season 1"
                                />
                            </div>

                            <div className="col-12 col-lg-8">
                                <label className="form-label">Bible (JSON)</label>
                                <textarea
                                    className="form-control bg-black text-white border-secondary mono"
                                    rows={10}
                                    value={bibleText}
                                    onChange={(e) => setBibleText(e.target.value)}
                                />
                            </div>

                            <div className="col-12">
                                {/* <button className="btn btn-primary" disabled={!canCreate} onClick={onCreate}>Create</button> */}
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={saveSeries}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>

            
        </div>
    )
}