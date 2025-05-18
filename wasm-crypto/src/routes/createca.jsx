import { useState } from "react";
import { GeneralSubjectFormComponent, InputComponent, ExtendedKeyUsagesComponent, StyledCheckbox, KeyUsagesComponent } from "../components/form/input";
import { Loader } from "../components/loader";
import { Button } from "../components/button";
import { Page } from "../components/pageWrapper";
import { DnsNames } from "../components/form/dnsNames";
import { getKeyUsages } from "../components/form/keyusages";

export function CreateCA({ setModal }) {
    const [created, setCreated] = useState(false);
    const [cn, setCn] = useState(false);
    const [loading, setLoading] = useState(false);

    function submitHandle(e) {
        e.preventDefault();
        const form = document.getElementById('createcaForm');
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

        if (!commonname) {
            setLoading(false)
            setCreated(false)
            setModal({ data: "Need atleast a common name to generate a certificate" })
            return
        }

        setCn(commonname)
        setTimeout(() => {
            createCert({org, country, locality, street, postcode, commonname, dnsNames, keyUsages})
        }, 1000)
    }

    function createCaCertificate(arr) {
        return new Promise((resolve) => {
            const res = window.createCaCertificate(...arr);
            resolve(res);
        });
    }

    function createCert({ org, country, locality, street, postcode, commonname, dnsNames, keyUsages}) {
        createCaCertificate([commonname, org || "null", country || "null", locality || "null", street || "null", postcode || "null", dnsNames || "null", keyUsages]).then(res => {
            setLoading(false)
            setCreated(res)
        }).catch(err => {
            console.log(err)
        })
    }

    function downloadFile(fileData, isKey = false) {
        const element = document.createElement("a");
        const file = new Blob([fileData], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = isKey ? `${cn}.key` : `${cn}.crt`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    let FormComponent = () => {
        return (
            <form id="createcaForm" className="md:w-[75%] w-[90%] flex flex-col gap-4 mt-2" onSubmit={(e) => { setLoading(true); submitHandle(e) }}>
                <GeneralSubjectFormComponent />

                    <DnsNames />
                
                    <p className="text-red-500">NOT IMPLEMENTED</p>
                <div className="flex gap-6 lg:gap-0 justify-center lg:justify-evenly flex-col md:flex-row flex-wrap border-2 border-red-500 p-2">
                    <KeyUsagesComponent type="ca"/>
                    {/* <ExtendedKeyUsagesComponent type="ca"/> */}
                </div>

            <div className="w-full flex justify-center">
                <Button type="submit">Save</Button>
            </div>
        </form>)
    }

    let SuccessfulCreate = () => {
        return (
            <div className="">
                <p>Successfully created your certificate authority certificate</p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => downloadFile(created.caPEM)}>Download Cert</Button>
                    <Button onClick={() => downloadFile(created.Priv, true)}>Download Private Key</Button>
                </div>
                <Button onClick={() => {
                    window.location.reload()
                }}>Restart</Button>

            </div>
        )
    }

    return (
        <Page title="Create CA Certificate">
            {(loading && cn) && <Loader />}
            {(!created && !loading) && <FormComponent />}
            {(created && !loading) && <SuccessfulCreate />}
        </Page>
    )
}
