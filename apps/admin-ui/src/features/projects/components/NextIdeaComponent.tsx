"use client";
import { useState, useEffect } from 'react';
import { BsArrowUpCircleFill } from "react-icons/bs";
import { Collapse, Button, Form, Table } from 'react-bootstrap';
import { CreateProjectDto } from '../types';

export function NextIdeaComponent({ project, }: {
    project: any
}) {
    const [open, setOpen] = useState(true);
    const [reset, setReset] = useState(true);
    console.log(project)
    function toProject(idea: any) {
            const seriesId = idea.series
            const body: CreateProjectDto = {
              topic: idea.topic,
              pillar: idea.pillar,
              seriesId: seriesId,
              continuityMode: idea.continuity || "light",
              language:  "en",
              durationMinutes: idea.duration_minutes || 6,
              format:  "youtube_long",
              tone: idea.tone,
            };

        idea.exist = true
        setReset(!reset);


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
                        <h1 className="h4 mt-2 mb-1">Next Ideas </h1>
                        <h2 style={{
                            transform: `rotate(${open ? 0 : '180deg'})`,
                            transition: 'transform ease-in-out .3s', fontSize: 44
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
                                    project.prompt_pack_json.next_ideas.map((idea: any, index: number) => (
                                        <tr key={index}>
                                            <td>{index}</td>
                                            <td>{idea.topic}</td>
                                            <td>{idea.tone}</td>
                                            <td>{idea.pillar}</td>
                                            <td>{idea.continuity}</td>
                                            <td>{idea.series.name}</td>
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
                                                    {idea.exist ?  "Done" : "Project"}
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
        </div>
    )
}