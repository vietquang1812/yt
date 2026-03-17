"use client";
import { Collapse, Button, Form, Badge, Toast, Modal } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { BsArrowUpCircleFill } from "react-icons/bs";
import { FaCopy, FaCheck } from "react-icons/fa";
import { fetchJSON } from '@/lib/api/fetchJSON';
import { PromptPackPart } from '../../types';
import { getImage } from '@/lib/functions/get_image';
import { ModalSaveSegmentContent } from './ModalSaveSegmentContent';

export function ProjectSegments({ project }: { project: any }) {
    const [part, setPart] = useState(1);
    const [segmentId, setSegmentId] = useState(1);
    const [open, setOpen] = useState(true);
    const [segement, setSegement] = useState(1);
    const [reset, setReset] = useState(true);
    const [issue, setIssue] = useState(0);
    const [showB, setShowB] = useState(true);
    const [showFile, setShowFile] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [img, setImg] = useState<Blob>();
    const toggleShowB = () => setShowB(!showB);
    const handleCloseUpload = () => setShowUpload(false)
    useEffect(() => {
        countIssue()
        getImageData()
    }, [project]);

    async function getImageData() {
        const imgData = await getImage(`/api/assets/images/prompt.png`)
        if (imgData) {
            setImg(imgData)
        }
    }

    function countIssue() {
        let n = 0;
        project.segments.forEach((p: any) => {
            p.segments.forEach((s: any) => {
                if (!s.status) {
                    n++;
                }
            })
        })

        setIssue(n)
    }

    function changePart(index: number) {
        setPart(index)
        setSegement(-1)
    }

    async function savePartSegment(part: number, seg: any) {

        await fetchJSON(
            `/api/projects/${project.id}/segments/parts/${part}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: JSON.stringify(seg) }),
            }
        );

    }

    async function updateSegmentStatus(part: number, segment_id: number) {
        // const item = project.segments.find((s: any) => s.part === part)
        // const seg = item.segments.find((p: any) => p.segment_id === segment_id)
        // if (seg != null) {
        //     seg.status = !seg.status
        // }
        // await savePartSegment(part, item)
        setShowUpload(true)
        countIssue()
        setReset(!reset)
    }

    async function copyPrompt(copyText: string, part: number, segment_id: number) {
        const text = `
        ${copyText}
        - clean background, no text, no logos
        - 2k resolution, shot on 35mm lens --ar 16:9
        `
        navigator.clipboard.writeText(text)
        toggleShowB()
        setTimeout(() => toggleShowB(), 1200);
        // // Chuẩn bị dữ liệu để Copy
        // const data = img ? [
        //     new ClipboardItem({
        //         'image/png': img,
        //         'text/plain': new Blob([copyText], { type: 'text/plain' }),
        //     }),
        // ] : [new ClipboardItem({
        //     'text/plain': new Blob([copyText], { type: 'text/plain' }),
        // }),
        // ];
        // await navigator.clipboard.write(data);
        // // await navigator.clipboard.writeText(copyText);
        // toggleShowB()
        // setTimeout(() => toggleShowB(), 1200);
    }

    async function copyImage() {
        const imgData = await getImage('/api' + project.channel.image)
        if (imgData) {
            const data = [new ClipboardItem({
                'image/png': imgData,
            }),]

            await navigator.clipboard.write(data);
        }
    }



    async function saveFileAndAudio() {

    }

    function showModalUpload(part: number, segment_id: number) {
        setPart(part)
        setSegmentId(segment_id)
        setShowUpload(true)
    }


    if (!project.hasOwnProperty('topic')) return (<></>)
    return (
        <div className="card">
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
                        <h1 className="h4 mt-2 mb-1">{project.topic} <Badge bg={issue === 0 ? "success" : "warning"} className=' rounded rounded-circle'>{issue}</Badge></h1>
                        <div style={{
                            transform: `rotate(${open ? 0 : '180deg'}) `,
                            transition: 'transform ease-in-out .3s', fontSize: 44,
                        }}><BsArrowUpCircleFill /></div>

                    </div>
                </Button>

            </div >
            <div className="card-body">
                <Collapse in={open} key={'project-' + project.id}>
                    <div className="row">
                        <div className="col-3 border-end border-white position-relative">
                            <div className='position-sticky' style={{ top: 40 }}>
                                {project.prompt_pack_json.parts.map((prompt: PromptPackPart) => (
                                    <Button
                                        key={'part-' + prompt.part}
                                        onClick={() => changePart(prompt.part)}
                                        aria-controls="example-collapse-text"
                                        aria-expanded={prompt.part === part}
                                        variant={prompt.part === part ? 'primary' : "outline-primary"}
                                        className='w-100 text-start mt-3 text-white'
                                    >
                                        {prompt.part}. {prompt.role}
                                    </Button>

                                ))}
                                <div className='d-flex align-items-center'>
                                    <img src={'/api/' + project.channel.image} alt="" className='d-block w-50 mt-4' />
                                    <Button
                                        className='ms-2'
                                        onClick={() => copyImage()}
                                        variant={"link"}
                                    >
                                        <FaCopy />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className='col-9'>
                            {project.segments.map((s: any) => {
                                const segments = s.segments.map((p: any) => (
                                    <div className={(p.status ? 'border-success' : 'border-warning') + ' border mb-3 rounded-2 ' + ('segment-' + s.part + '-' + p.segment_id)} key={'segment-' + s.part + '-' + p.segment_id}>
                                        <div className='d-flex  align-items-center' >
                                            <Button
                                                key={s.part + '-' + p.segment_id}
                                                onClick={() => setSegement(p.segment_id)}
                                                aria-controls="example-collapse-text"
                                                aria-expanded={s.part === part && p.segment_id === segement}
                                                variant={"link"}
                                                className='w-100 text-start p-3 text-decoration-none text-light'
                                            >
                                                <h5 className='h5'>{p.segment_id}: {p.visual_notes}</h5>
                                            </Button>
                                            <Button
                                                key={'file_' + s.part + '-' + p.segment_id}
                                                onClick={() => showModalUpload(s.part, p.segment_id)}
                                                aria-controls="example-collapse-text"
                                                aria-expanded={s.part === part && p.segment_id === segement}
                                                variant={"info"}
                                                size="sm"
                                                className=' me-2 text-light'
                                            >
                                                Upload
                                            </Button>

                                        </div>
                                        <Collapse in={s.part === part && p.segment_id === segement} key={'collapse-' + s.part + '-' + p.segment_id}>
                                            <div className='p-2'>
                                                <div className='d-flex align-items-start'>
                                                    {p.image_prompt}
                                                    <Button
                                                        onClick={() => copyPrompt(p.image_prompt, s.part, p.segment_id)}
                                                        variant={"link"}
                                                    >
                                                        <FaCopy />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Collapse>
                                    </div>

                                ))

                                return (
                                    <Collapse in={s.part === part} key={'collapse-' + s.part}>
                                        <div>
                                            {segments}
                                        </div>
                                    </Collapse>
                                )
                            })}

                        </div>
                    </div>
                </Collapse>
            </div>
            <ModalSaveSegmentContent show={showUpload} project={project} part={part} segementId={segmentId} onClose={() => setShowUpload(false)} />

        </div >
    )
}