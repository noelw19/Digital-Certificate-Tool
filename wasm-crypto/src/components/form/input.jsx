export function InputComponent({id="", label, placeholder, name, required = false}) {
    return (
        <div className="w-full flex gap-2 justify-between">
            <label className="p-2">{label}:</label>
            <input id={id} required={required} className=" block w-[50%] rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-gray-600 sm:text-sm/6" name={name} placeholder={placeholder}></input>
        </div>
    )
}

export function GeneralSubjectFormComponent() {
    return (
        <>
            <InputComponent placeholder="Common Name" name="commonname" label="Common Name" required />
            <InputComponent placeholder="Organisation" name="org" label="Organisation" />
            <InputComponent placeholder="Country" name="country" label="Country" />
            <InputComponent placeholder="Locality" name="locality" label="Locality" />
            <InputComponent placeholder="Street Address" name="street" label="Street Address" />
            <InputComponent placeholder="Post Code" name="postcode" label="Post Code" />
        </>
    )
}

export function FileInputComponent({ name, id, accept }) {
    return (
        <div className="mx-auto max-w-xs">
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">{name}</label>
            <input id={id} accept={accept} required type="file" className="mt-2 block w-full text-sm file:mr-4 file:rounded-md hover:cursor-pointer file:border-0 file:bg-green-600 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-green-700 focus:outline-none disabled:pointer-events-none disabled:opacity-60" />
        </div>
    )
}

export function StyledCheckbox({ label, id, checked = false }) {
    let alwaysChecked = checked == true || null
    return (
        <div className="inline-flex items-center">
            <label className="flex items-center cursor-pointer relative">
                <input type="checkbox" name={id} checked={alwaysChecked} readOnly={alwaysChecked} className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow hover:shadow-md border border-slate-300 checked:bg-green-600 checked:border-green-600" id={id} />
                <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                </span>
            </label>
            <label className="cursor-pointer ml-2 text-slate-600 text-sm" htmlFor={id}>
                {label} {alwaysChecked && <span className="text-red-500">*required</span>}
            </label>
        </div>
    )
}


{/* 
    Key Usages
    KeyUsageDigitalSignature
    KeyUsageContentCommitment
    KeyUsageKeyEncipherment
    KeyUsageDataEncipherment
    KeyUsageKeyAgreement
    KeyUsageCertSign
    KeyUsageCRLSign
    KeyUsageEncipherOnly
    KeyUsageDecipherOnly 
*/}
export function KeyUsagesComponent({type}) {

    let isServer = type === "server" || null;
    let isClient = type === "client" || null;
    let isCA = type === "ca" || null;

    return (
        <div className="w-fit">
            <p className="text-left pl-2">Key Usages</p>
            <div className="flex flex-col gap-2 pl-4 mt-2">
                <StyledCheckbox label="Digital Signature" id="digitalsignature" checked={isServer || isClient}/>
                <StyledCheckbox label="Content Commitment" id="contentcommitment" />
                <StyledCheckbox label="Key Encipherment" id="keyencipherment" checked={isServer || isClient}/>
                <StyledCheckbox label="Data Encipherment" id="dataencipherment" />
                <StyledCheckbox label="Key Agreement" id="keyagreement" />
                <StyledCheckbox label="Cert Sign" id="certsign" checked={isCA}/>
                <StyledCheckbox label="CRL Sign" id="crlsign" />
                <StyledCheckbox label="Encipher Only" id="encipheronly" />
            </div>
        </div>
    )
}

{/* 
    Extended Key Usages
    serverAuth             SSL/TLS WWW Server Authentication
    clientAuth             SSL/TLS WWW Client Authentication
    codeSigning            Code Signing
    emailProtection        E-mail Protection (S/MIME)
    timeStamping           Trusted Timestamping
    OCSPSigning            OCSP Signing
    ipsecIKE               ipsec Internet Key Exchange
    msCodeInd              Microsoft Individual Code Signing (authenticode)
    msCodeCom              Microsoft Commercial Code Signing (authenticode)
    msCTLSign              Microsoft Trust List Signing
    msEFS                  Microsoft Encrypted File System 
*/}
export function ExtendedKeyUsagesComponent({type}) {
    let isServer = type === "server" || null;
    let isClient = type === "client" || null;

    return (
        <div className="w-fit">
            <p className="text-left pl-2">Extended Key Usages</p>
            <div className="flex flex-col gap-2 pl-4 mt-2">
                <StyledCheckbox label="TLS Web server authentication" id="webserverauth" checked={isServer}/>
                <StyledCheckbox label="TLS Web Client authentication" id="webclientauth" checked={isClient}/>
                <StyledCheckbox label="Code Signing" id="codesigning" />
                <StyledCheckbox label="Email Protection" id="emailprotection" />
                <StyledCheckbox label="Time Stamping" id="timestamping" />
                <StyledCheckbox label="OCSP Signing" id="ocspsigning" />
            </div>
        </div>
    )
}