import { CreateProjectDto } from "../../types";
import { Collapse, Button, Form, Badge, Toast, Modal } from 'react-bootstrap';
import { useEffect, useMemo, useState } from "react";
import { SeriesDto } from "@/features/series/types";
import { getSeries } from "@/features/series/api";
import { refresh } from "next/cache";
import Link from "next/link";

export function ModalFormProject(
    { project, handleClose, edit, show, channelId }:
        {
            project: CreateProjectDto,
            handleClose: () => void,
            edit: boolean,
            show: boolean,
            channelId: string
        }
) {

    const [formProject, setFormProject] = useState<CreateProjectDto>()
    const [topic, setTopic] = useState("");
    const [pillar, setPillar] = useState("");
    const [seriesId, setSeriesId] = useState<string>("");
    const [continuityMode, setContinuityMode] = useState<CreateProjectDto["continuityMode"]>("light");
    const [language, setLanguage] = useState("en");
    const [durationMinutes, setDurationMinutes] = useState<number>(6);
    const [format, setFormat] = useState<string>("youtube_long");
    const [tone, setTone] = useState("");
    const [allSeries, setAllSeries] = useState<SeriesDto[]>([]);

    useEffect(() => {
        refresh()
    }, [])

    async function refresh() { 
        const all = await getSeries()
        setAllSeries(all)
    }
    async function saveChannel() {

    }

    function seriesNameById(id?: string) {
        if (!id) return "";
        const s = allSeries.find((x) => x.id === id);
        return s?.name || "";
    }

    return (
        <Modal show={show} onHide={handleClose} size="xl"
            aria-labelledby="contained-modal-title-vcenter"
            centered>
            <Modal.Header closeButton>
                <Modal.Title>{edit ? 'Create Project' : 'Edit Project'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="card bg-dark text-white mb-3 border-0" style={{ borderRadius: 16 }}>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-12">
                                <label className="form-label text-secondary small">Topic (required)</label>
                                <input
                                    className="form-control bg-black border-0 text-white"
                                    placeholder="e.g., Why you feel stuck even when life looks fine"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label text-secondary small">Pillar / Angle</label>
                                <input
                                    className="form-control bg-black border-0 text-white"
                                    placeholder="e.g., calm psychological reframe"
                                    value={pillar}
                                    onChange={(e) => setPillar(e.target.value)}
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label text-secondary small">Series</label>
                                <div className="input-group">
                                    <select
                                        className="form-select bg-black border-0 text-white"
                                        value={seriesId}
                                        onChange={(e) => setSeriesId(e.target.value)}
                                    >
                                        <option value="">(none)</option>
                                        {allSeries.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                    <Link className="btn btn-outline-light" type="button" href={"/series"} >
                                        Create series
                                    </Link>
                                </div>
                                <div className="text-secondary small mt-1">
                                    If set, scripts will follow Series Bible + memory for continuity.
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <label className="form-label text-secondary small">Continuity</label>
                                <select
                                    className="form-select bg-black border-0 text-white"
                                    value={continuityMode}
                                    onChange={(e) => setContinuityMode(e.target.value as any)}
                                >
                                    <option value="none">none</option>
                                    <option value="light">light</option>
                                    <option value="occasionally_strong">occasionally_strong</option>
                                </select>
                            </div>

                            <div className="col-12 col-md-4">
                                <label className="form-label text-secondary small">Language</label>
                                <select
                                    className="form-select bg-black border-0 text-white"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="en">English (en)</option>
                                    <option value="vi">Vietnamese (vi)</option>
                                </select>
                            </div>

                            <div className="col-12 col-md-4">
                                <label className="form-label text-secondary small">Duration (minutes)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={60}
                                    className="form-control bg-black border-0 text-white"
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label text-secondary small">Format</label>
                                <select
                                    className="form-select bg-black border-0 text-white"
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                >
                                    <option value="youtube_long">youtube_long</option>
                                    <option value="shorts">shorts</option>
                                </select>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label text-secondary small">Tone</label>
                                <input
                                    className="form-control bg-black border-0 text-white"
                                    placeholder="e.g., calm, grounded, mysterious"
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                />
                            </div>
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