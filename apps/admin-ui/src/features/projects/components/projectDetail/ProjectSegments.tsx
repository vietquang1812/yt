"use client";
import { Collapse, Button, Form, Badge, Toast, Modal, Table } from 'react-bootstrap';
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
    const [showSegItem, setShowSegItem] = useState<boolean[][]>([]);
    const toggleShowB = () => setShowB(!showB);
    const handleCloseUpload = () => setShowUpload(false)

    useEffect(() => {
        if (project.segments) {
            getPromptByName()
            countIssue()
            getImageData()
            initShowSegItem()
        }
    }, [project]);

    async function getPromptByName() {
        
    }

    function initShowSegItem() {
        let arr: boolean[][] = []
        project.segments.forEach((s: any) => {
            arr.push(s.segments.map((p: any) => false))
        })
        setShowSegItem([...arr])
    }
    function toggleShowSegItem(part: number, segment_id: number) {
        const arr = [...showSegItem]
        arr[part - 1][segment_id - 1] = !arr[part - 1][segment_id - 1]
        setShowSegItem(arr)
    }
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
        // const text = `
        // ${copyText}
        // - clean background, no text, no logos
        // - 2k resolution, shot on 35mm lens --ar 16:9
        // `
        const text = copyText
        navigator.clipboard.writeText(text)
        toggleShowB()
        setTimeout(() => toggleShowB(), 1200);
    }

    async function copyAllPrompt() {
        let text = ''
        project.segments.forEach((s: any) => {
            s.segments.forEach((p: any) => {
                text += (p.video_prompt).replaceAll('\n', '; ') + '\n'
            })
        })
        navigator.clipboard.writeText(text)
        toggleShowB()
        setTimeout(() => toggleShowB(), 1200);
    }

    async function copyAllScripts() {
        let text = ''
        project.prompt_pack_json.parts.forEach((p: any) => {
            text += p.content + '\n\n'
        })
        navigator.clipboard.writeText(text)
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
    if (!project.segments) return (<></>)
    return (
        <div className="card">
            <div className="card-header">
                <div className='d-flex'>
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
                    <Button
                        className='ms-2'
                        onClick={() => copyAllPrompt()}
                        variant={"success"}
                    >
                        Copy All Prompts
                    </Button>
                    <Button
                        className='ms-2'
                        onClick={() => copyAllScripts()}
                        variant={"info"}
                    >
                        Copy All Scripts
                    </Button>
                </div>

            </div >
            <div className="card-body">
                <Collapse in={open} key={'project-' + project.id}>
                    <div className="row">
                        <div className="col-3 border-end border-white position-relative">
                            <div className='position-sticky' style={{ top: 40 }}>
                                {project.segments.map((seg: any, index: number) => (

                                    <Button
                                        key={'part-' + seg.part}
                                        onClick={() => changePart(seg.part)}
                                        aria-controls="example-collapse-text"
                                        aria-expanded={seg.part === part}
                                        variant={seg.part === part ? 'primary' : "outline-primary"}
                                        className='w-100 text-start mt-3 text-white flex-1'
                                    >
                                        {seg.part}. {seg.role}<br />
                                        <small className=' text-white'>{seg.segments?.length || 0}: {seg.segments[0]?.start_time} - {seg.segments[seg.segments.length - 1]?.end_time}</small>
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
                                                onClick={() => toggleShowSegItem(s.part, p.segment_id)}
                                                aria-controls="example-collapse-text"
                                                aria-expanded={s.part === part && p.segment_id === segement}
                                                variant={"link"}
                                                className='w-100 text-start p-3 text-decoration-none text-light'
                                            >
                                                <h5 className='h5'>{p.segment_id}: {p.narration.substring(0, 60)}...</h5>
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
                                        <Collapse in={showSegItem[s.part - 1]?.[p.segment_id - 1]} key={'collapse-' + s.part + '-' + p.segment_id}>
                                            <div className='p-2'>
                                                <div className='d-flex align-items-start'>
                                                    <Table>
                                                        <tbody>
                                                            <tr>
                                                                <td>box chat</td>
                                                                <td>{p.box_text}</td>
                                                                <td>
                                                                    <Button
                                                                        onClick={() => copyPrompt(p.box_text, s.part, p.segment_id)}
                                                                        variant={"link"}
                                                                    >
                                                                        <FaCopy />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>transition</td>
                                                                <td>{p.transition}</td>
                                                                <td>
                                                                    <Button
                                                                        onClick={() => copyPrompt(p.transition, s.part, p.segment_id)}
                                                                        variant={"link"}
                                                                    >
                                                                        <FaCopy />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>narration</td>
                                                                <td>{p.narration}</td>
                                                                <td>
                                                                    <Button
                                                                        onClick={() => copyPrompt(p.narration, s.part, p.segment_id)}
                                                                        variant={"link"}
                                                                    >
                                                                        <FaCopy />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>video_prompt</td>
                                                                <td>{p.video_prompt.substring(0, 100)}...</td>
                                                                <td>
                                                                    <Button
                                                                        onClick={() => copyPrompt(p.video_prompt, s.part, p.segment_id)}
                                                                        variant={"link"}
                                                                    >
                                                                        <FaCopy />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </Table>

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