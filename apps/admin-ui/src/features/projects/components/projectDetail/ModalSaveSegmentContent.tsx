import { apiUpload } from '@/features/channels/api';
import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FileUploader } from "react-drag-drop-files";


export function ModalSaveSegmentContent({
    project,
    part,
    segementId,
    show,
    onClose
}: {
    show: boolean;
    onClose: () => void;
    project: any;
    part: number;
    segementId: number;
}) {
    const [base64, setBase64] = useState('');
    const fileTypes = ["PNG"];
    const [file, setFile] = useState(null)
    const [image, setImage] = useState('')
    
    const handleChange = (f: any) => {
        console.log(f)
        setFile(f);
    };



    async function saveFile() {
        let url = image
        if (file != null) {
            const uploadRes = await apiUpload(file) as any;
            if (uploadRes.status) {
                url = uploadRes.url
                setImage(uploadRes.url)
            }
        }
        onClose()
    }
    async function handleChangeFile() {

    }

    return (
        <Modal show={show} onHide={onClose} size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered>
            <Modal.Header closeButton>
                <Modal.Title>Upload File and Audio</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className='row'>
                    <div className='col-6'>
                        <FileUploader handleChange={handleChangeFile} name="file" types={fileTypes} />
                    </div>
                    <div className='col-6'>
                        <textarea
                            className="form-control mt-2"
                            style={{ minHeight: 300 }}
                            value={base64}
                            onChange={(e) => setBase64(e.target.value)}
                        />
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={saveFile}>
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    )

}

function setImage(url: any) {
    throw new Error('Function not implemented.');
}
