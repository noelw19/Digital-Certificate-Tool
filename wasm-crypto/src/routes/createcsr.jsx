import React, { useState, useEffect, useCallback } from "react";
import { GeneralSubjectFormComponent, KeyUsagesComponent, ExtendedKeyUsagesComponent, InputComponent, FileInputComponent } from "../components/form/input";
import { Page } from "../components/pageWrapper";
import { Button } from "../components/button";
import { DnsNames } from "../components/form/dnsNames";
import { Loader } from "../components/loader";

export function CreateCSR({ setModal }) {
    const [loading, setLoading] = useState(false);
    const [created, setCreated] = useState(false);
    const [data, setData] = useState(false);
    const [privateKey, setPrivateKey] = useState(false);
    const [hasKey, setHasKey] = useState(null);
    const [cn, setCn] = useState(false);

    function createCSR_WASM(arr) {
        return new Promise((resolve) => {
            const res = window.createCSR(...arr);
            resolve(res);
        });
    }

    let createCSR = useCallback(({ org, country, locality, street, postcode, commonname, key, dnsNames }) => {

        window.wasm == true && createCSR_WASM([commonname, org || "null", country || "null", locality || "null", street || "null", postcode || "null", key, dnsNames]).then(res => {
            setCreated(res)
        }).catch(err => {
            console.log(err)
        })
        setLoading(false)
    }, [])

    useEffect(() => {
        if (hasKey !== null && data.commonname) {
            createCSR({ ...data, key: hasKey ? privateKey : "null" })
        }
    }, [privateKey, createCSR, data, hasKey])


    function submitHandle(e) {
        e.preventDefault()
        try {
            const form = document.getElementById('certForm');

            const formData = new FormData(form);
            let org = formData.get("org")
            let country = formData.get("country")
            let locality = formData.get("locality")
            let street = formData.get("street")
            let postcode = formData.get("postcode")
            let commonname = formData.get("commonname")
            let dnsNames = formData.getAll("Sans").join(",")

            let privKey = document.getElementById("privKey")
            setHasKey(privKey.files.length)

            if (!commonname) {
                setLoading(false)
                setCreated(false)
                setModal({ data: "Need atleast a common name to generate a certificate" })
                return
            }

            setCn(commonname)
            setData({ org, country, locality, street, postcode, commonname, dnsNames })

            fileInputChangeHandler({ target: privKey })
        } catch (error) {
            console.log(error)
        }
    }

    function fileInputChangeHandler(e) {
        const file = e.target.files[0]

        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const data = e.target.result;
                setPrivateKey(data)
            };

            reader.readAsText(file);
        }
    }

    function CertForm() {
        return (
            <form id="certForm" className="md:w-[75%] w-[90%] flex flex-col gap-4 mt-2" onSubmit={(e) => { setLoading(true); submitHandle(e) }}>
                <GeneralSubjectFormComponent />

                <DnsNames />

                <div className="mx-auto max-w-xs">
                    <label htmlFor="privKey" className="mb-1 block text-sm font-medium text-gray-700">Private Key</label>
                    <input id="privKey" accept=".key" type="file" className="mt-2 block w-full text-sm file:mr-4 file:rounded-md hover:cursor-pointer file:border-0 file:bg-green-600 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-green-700 focus:outline-none disabled:pointer-events-none disabled:opacity-60" />
                </div>
                <p className="text-sm text-red-500">Note: If private key not provided one will be generated for you.</p>

                <div className="w-full flex justify-center">
                    <Button type="submit" >Save</Button>
                </div>
            </form>
        )
    }

    function downloadFile(fileData, isKey = false) {
        const element = document.createElement("a");
        const file = new Blob([fileData], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = isKey ? `${cn}.key` : `${cn}.csr`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    let SuccessfulCreate = () => {
        return (
            <div className="">
                <p>Successfully created your certificate signing request</p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => downloadFile(created.csr)}>Download CSR</Button>
                    <Button onClick={() => downloadFile(created.key, true)}>Download Private Key</Button>
                </div>
                <Button onClick={() => {
                    window.location.reload()
                }}>Restart</Button>

            </div>
        )
    }


    return (
        <Page title="Create CSR">

            {loading && <Loader />}
            {(!created && !loading) && <CertForm />}
            {(created && !loading) && <SuccessfulCreate />}
        </Page>
    )
}