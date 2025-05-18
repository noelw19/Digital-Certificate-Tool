import { Button } from "../components/button";
import { Page } from "../components/pageWrapper";
import { useState, useCallback, useEffect } from "react";
import { Loader } from "../components/loader";
import { WithTooltip } from "../components/tooltip";
import { digitalCertificate_info } from "../resources/certServices";

export function DecodePEMRoute({ setModal }) {
    const [pem, setPem] = useState(false)
    const [created, setCreated] = useState(false)
    const [loading, setLoading] = useState(false)

    function decodePEMPromise(pem) {
        return new Promise((resolve) => {
            const res = window.decodePEM(pem);
            resolve(res);
        });
    }

    return (
        <Page title="Decode PEM">
            {(!created && !loading) && <form id="certForm" className="md:w-[75%] w-[90%] h-fit flex flex-col p-2 gap-4 mt-2 overflow-none" onSubmit={() => { }}>
                <PemDecoder setPem={setPem} />
                <Button onClick={(e) => {
                    e.preventDefault()
                    setLoading(true)
                    if (pem.includes("CERTIFICATE REQUEST")) {
                        setLoading(false)
                        setCreated(false)
                        setModal({ data: "Cannot decode Certificate signing requests yet." })
                        return
                    } else {

                        decodePEMPromise(pem).then(res => {
                            setCreated(res)
                            setLoading(false)
                        })
                    }
                }}>Decode</Button>
            </form>}
            {loading && <Loader />}
            {(created && !loading) && <div className="w-[75%] p-4 flex justify-center">
                {created.type === "CERTIFICATE" ? certViewer(created) : keyViewer(created)}
            </div>}
            {(created && !loading) && <Button onClick={() => {
                setCreated(false)
                setPem(false)
            }}>Reset</Button>}
        </Page>
    )
}

function certViewer(data) {
    const issueDate = new Date(data.notBefore);
    const expiryDate = new Date(data.notBefore);
    const localIssue = issueDate.toLocaleString();
    const localExpire = expiryDate.toLocaleString();

    return (
        <div className="w-[70%] text-left">
            <p className="text-xl font-bold text-center">Certificate Data</p>
            <p className={`text-left w-fit p-2 rounded ${data.isCA ? "bg-green-500" : "bg-red-500"}`}>Is CA</p>
            <WithTooltip tooltip={digitalCertificate_info.issuer}>
                <p className="text-left">Issuer: {data.issuer} <span className="text-red-500">*self issued</span></p>
            </WithTooltip>
            <div className="w-full mt-4 mb-4">
                <WithTooltip tooltip={digitalCertificate_info.subject}>
                    <p className="text-left font-bold">Subject</p>
                </WithTooltip>
                <div className="flex flex-col items-start pl-4">
                    <p>Common Name: {data.commonName}</p>
                    <p>Organisation: {data.organisation}</p>
                    <p>Locality: {data.locality}</p>
                    <p>Street: {data.street}</p>
                    <p>Country: {data.country}</p>
                </div>
            </div>
            <WithTooltip tooltip={digitalCertificate_info.validFrom}>
                <p>Issue: {localIssue}</p>
            </WithTooltip>
            <WithTooltip tooltip={digitalCertificate_info.validTo}>
                <p>Expiry: {localExpire}</p>
            </WithTooltip>
            <WithTooltip tooltip={digitalCertificate_info.serialNumber}>
                <p>Serial Number: {data.serialnumber}</p>
            </WithTooltip>
            {data.keyUsages !== "" && <div className="my-4">
                <WithTooltip tooltip={digitalCertificate_info.keyUsage}>
                    <p className="mb-2 font-bold">Key Usages</p>
                </WithTooltip>
                {data.keyUsages.split(",").map((d, i) => {
                    return <p key={i} className="pl-4">{i + 1}. {d.trim()}</p>
                })}
            </div>}

            {data.extUsages !== "" && <div className="my-4">
                <WithTooltip tooltip={digitalCertificate_info.extendedKeyUsage}>
                    <p className="mb-2 font-bold">Extended Key Usages</p>
                </WithTooltip>
                {data.extUsages.split(",").map((d, i) => {
                    return <p key={i} className="pl-4">{i + 1}. {d.trim()}</p>
                })}
            </div>}

            {data.dnsNames !== "" && <div className="my-4">
                <p className="mb-2 font-bold">DNS Names</p>
                {data.dnsNames !== "" && data.dnsNames.split(",").map((d, i) => {
                    return <p key={i} className="pl-4">{i + 1}. {d.trim()}</p>
                })}
            </div>}
        </div>
    )
}

function keyViewer(data) {
    return (
        <div className="w-[90%] text-left">
            <p className="text-xl font-bold text-center mb-4">Private Key Data</p>
            <div>
                <p><span className="font-bold">Type:</span> {data.type}</p>
                <div className="w-full my-4">
                    <p className="font-bold">Private Key Hex - {data.privateKey.length} characters</p>
                    <p className="w-full wrap-break-word">{data.privateKey.split("").splice(0, 500).join("")}{"\n"}.......{"\n"}{data.privateKey.split("").splice(data.privateKey.length - 500, data.privateKey.length - 1).join("")}</p>
                </div>
                <div className="my-4">
                    <p className="font-bold">Public Key Hex - {data.publicKey.length} characters</p>
                    <p className="wrap-break-word">{data.publicKey}</p>
                </div>
            </div>
        </div>
    )
}


export default function PemDecoder({ setPem }) {
    const [pemData, setPemData] = useState('');
    const [displayPemData, setDisplayPemData] = useState('');
    const [error, setError] = useState('');
    const [upload, setUpload] = useState(null)

    useEffect(() => {
        setPem(pemData)
    }, [pemData, setPem])

    const handleTextChange = (e) => {
        setUpload(false)
        let normalized = normalizePem(e.target.value)
        setDisplayPemData(normalized);
        setPemData(e.target.value);
        setError('');
    };

    const handleFile = (file) => {
        const isText = file.type.startsWith('text') || /\.(pem|crt|key|txt)$/i.test(file.name);
        if (!isText) {
            setError('Invalid file type. Please upload a PEM, CRT, KEY, or TXT file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setPemData(reader.result);
            setDisplayPemData(reader.result);

            setError('');
        };
        reader.onerror = () => {
            setError('Failed to read the file.');
        };
        reader.readAsText(file);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            setUpload(true)
            handleFile(file);
        }
    }, []);

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUpload(true)
            handleFile(file);
        }
    };

    const normalizePem = (text) => {
        return text
            .trim()
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/-----BEGIN ([\w\s]+)-----/, '-----BEGIN $1-----\n') // Line after BEGIN
            .replace(/-----END ([\w\s]+)-----/, '\n-----END $1-----'); // Line before END
    };

    return (
        <div className="w-full h-[100%] mx-auto mb-4 p-2 border rounded-lg shadow-md overflow-none">
            <h2 className="text-xl font-semibold mb-4">PEM Decoder</h2>

            {(upload === null || upload === false) && <textarea
                className="w-full p-2 border text-sm rounded mb-4 h-40 font-mono whitespace-pre-wrap"
                placeholder="Paste your PEM data here..."
                value={displayPemData}
                onChange={handleTextChange}
            />}

            {(upload === null || upload === false) && <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-400 p-4 rounded text-center mb-4 bg-gray-50"
            >
                Drag and drop your PEM file here
            </div>}

            <div className="mb-4">
                <input type="file" accept=".pem,.crt,.key,.txt" onChange={handleFileInputChange} />
            </div>

            {error && <p className="text-red-600">{error}</p>}

            {(pemData && upload) && (
                <div className="my-4 ">
                    <h3 className="font-semibold mb-2">Extracted PEM Data:</h3>
                    <pre className="bg-gray-100 p-2 rounded text-sm">{pemData}</pre>
                </div>
            )}
        </div>
    );
}
