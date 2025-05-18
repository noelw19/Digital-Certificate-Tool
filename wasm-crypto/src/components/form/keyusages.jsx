
let Ku = ["digitalsignature", "contentcommitment", "keyencipherment", "dataencipherment", "keyagreement", "certsign", "crlsign", "encipheronly"]
let ExtKu = ["webserverauth", "webclientauth", "codesigning", "emailprotection", "timestamping", "ocspsigning"]

export function getKeyUsages(formData) {
    let keyUsages = Ku.map(ku => {
        return formData.get(ku) == "on" ? ku : null
    }).filter(v => v != null).join(",");

    return keyUsages
}

export function getExtKeyUsages(formData) {
    let extKeyUsages = ExtKu.map(ku => {
        return formData.get(ku) == "on" ? ku : null
    }).filter(v => v != null).join(",");
    
    return extKeyUsages
}