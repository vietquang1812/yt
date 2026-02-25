"use client";
import {  useEffect } from 'react';
import { ProjectSegments } from './ProjectSegments';
export function BodyComponent({ project }: { project: any }) {
    useEffect(() => {

    }, [project]);
    
    if (!project.hasOwnProperty('topic')) return (<></>)
    return (
        <div className='d-flex flex-column'>
            <ProjectSegments project={project}/>
        </div>
    )
}