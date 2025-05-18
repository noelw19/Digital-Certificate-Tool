import React, { useCallback, useEffect, useState } from "react";
import { FileInputComponent, KeyUsagesComponent, ExtendedKeyUsagesComponent } from "../components/form/input";
import { Loader } from "../components/loader";
import { Button } from "../components/button";
import { GeneralSubjectFormComponent } from "../components/form/input";
import { Page } from "../components/pageWrapper";
import { DnsNames } from "../components/form/dnsNames";
import { getExtKeyUsages, getKeyUsages } from "../components/form/keyusages";

let Ku = ["digitalsignature", "contentcommitment", "keyencipherment", "dataencipherment", "keyagreement", "certsign", "crlsign", "encipheronly"]
let ExtKu = ["webserverauth", "webclientauth", "codesigning", "emailprotection", "timestamping", "ocspsigning"]

export function CreateCert({ setModal }) {
    const [created, setCreated] = useState(false);
    const [data, setData] = useState(false);
    const [loading, setLoading] = useState(false);
    const [caFile, setCaFile] = useState(false);
    const [keyFile, setKeyFile] = useState(false);
    const [cn, setCn] = useState(false);

    let url = window.location.href;
    if (!url.endsWith("server") && !url.endsWith("client")) window.location.href = window.location.origin

    let certType = url.split("=")[1]

    // capitalize
    let [first, ...rest] = certType
    let cap = first.toUpperCase() + rest.join("")


    function createCertificate(arr) {
        return new Promise((resolve) => {
            const res = window.createCertificate(...arr);
            resolve(res);
        });
    }

    let createCert = useCallback(({ org, country, locality, street, postcode, commonname, cert, key, dnsNames, keyUsages, extKeyUsages }) => {

        window.wasm == true && createCertificate([commonname, org || "null", country || "null", locality || "null", street || "null", postcode || "null", cert, key, dnsNames, keyUsages, extKeyUsages]).then(res => {
            setCreated(res)
        }).catch(err => {
            console.log(err)
        })
        setLoading(false)
    }, [])

    useEffect(() => {
        if (caFile && keyFile && data.commonname) {
            createCert({ ...data, cert: caFile, key: keyFile })
        }
    }, [caFile, keyFile, createCert, data])

    function submitHandle(e) {
        try {
            setLoading(true)
            e.preventDefault();

            const form = document.getElementById('certForm');
            if(!form.checkValidity()) {
                setLoading(false)
                return 
            } else {

                const formData = new FormData(form);
                let org = formData.get("org")
                let country = formData.get("country")
                let locality = formData.get("locality")
                let street = formData.get("street")
                let postcode = formData.get("postcode")
                let commonname = formData.get("commonname")
                let dnsNames = formData.getAll("Sans").join(",")

                if(!dnsNames.length) {
                    dnsNames = "null"
                }

                let keyUsages = getKeyUsages(formData);
                let extKeyUsages = getExtKeyUsages(formData);
                
                let caCert = document.getElementById("caFile")
                let cakey = document.getElementById("keyFile")
                
                if (!caCert.files[0] || !cakey.files[0]) {
                    setLoading(false)
                    setCreated(false)
                    setModal({ data: "Need a CA certificate and a Key to be able to generate a certificate." })
                    return
                }
                
                if (!commonname) {
                    setLoading(false)
                    setCreated(false)
                    setModal({ data: "Need atleast a common name to generate a certificate" })
                    return
                }
                
                setCn(commonname)
                setData({ org, country, locality, street, postcode, commonname, dnsNames, keyUsages, extKeyUsages })
                
                fileInputChangeHandler({ target: caCert })
                fileInputChangeHandler({ target: cakey })
                
            }

        } catch (error) {
            console.log(error)
        }
    }

    function fileInputChangeHandler(e) {
        const file = e.target.files[0]
        const type = e.target.id

        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const data = e.target.result;
                type === "caFile" ? setCaFile(data) : setKeyFile(data);;
            };

            reader.readAsText(file);
        }
    }

    function downloadFile(fileData, isKey = false) {
        const element = document.createElement("a");
        const file = new Blob([fileData], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = isKey ? `${cn}.key` : `${cn}.crt`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    let SuccessfulCreate = () => {
        return (
            <div className="">
                <p>Successfully created your {certType} certificate</p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => downloadFile(created.cert)}>Download Cert</Button>
                    <Button onClick={() => downloadFile(created.key, true)}>Download Private Key</Button>
                </div>
                <Button onClick={() => {
                    window.location.reload()
                }}>Restart</Button>

            </div>
        )
    }

    let CertForm = () => {
        return (
            <form method="get" id="certForm" className="md:w-[75%] w-[90%] flex flex-col gap-4 mt-2" onSubmit={(e) => { setLoading(true); submitHandle(e) }}>
                <GeneralSubjectFormComponent />

                {certType == "server" && <DnsNames />}


                <div className="flex gap-6 lg:gap-0 justify-center lg:justify-evenly flex-col md:flex-row flex-wrap p-2">
                    <KeyUsagesComponent type={certType} />
                    <ExtendedKeyUsagesComponent type={certType} />
                </div>

                <div className="flex flex-col md:flex-row mt-4">
                    <FileInputComponent name="CA Certificate" id="caFile" accept=".crt" />
                    <FileInputComponent name="CA Key" id="keyFile" accept=".key" />
                </div>

                <div className="w-full flex justify-center">
                    <Button type="submit" >Save</Button>
                </div>
            </form>
        )
    }

    return (
        <Page title={`Create ${cap} Certificate`} >
            {loading && <Loader />}
            {(!created && !loading) && <CertForm />}
            {(created && !loading) && <SuccessfulCreate />}
        </Page>
    )
}