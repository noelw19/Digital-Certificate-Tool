
export const digitalCertificate_info = {
    subject: "The entity (person, organization, or device) the certificate is issued to; contains structured identity info like common name (CN), organization (O), country (C), etc.",
    issuer: "The certificate authority (CA) that issued the certificate; structured similarly to 'subject' with identifying info.",
    serialNumber: "A unique identifier for the certificate assigned by the issuer; typically a large hexadecimal number.",
    validFrom: "The start date and time when the certificate becomes valid; usually in UTC date-time format.",
    validTo: "The end date and time when the certificate expires; also in UTC date-time format.",
    publicKey: "The public key used for encryption or verifying digital signatures; often in base64-encoded format and includes key type and key length.",
    signatureAlgorithm: "The algorithm used by the issuer to sign the certificate; e.g., 'sha256WithRSAEncryption'.",
    signature: "The digital signature created by the issuer; a long string of binary data usually represented in base64.",
    version: "The X.509 version of the certificate format; usually a small number like 3.",
    thumbprint: "A hashed value (e.g., SHA-1 or SHA-256) of the certificate; displayed as a hexadecimal string for quick reference or fingerprinting.",
    subjectAltName: "A list of additional domains, IPs, or email addresses the certificate is valid for; typically an array of strings.",
    keyUsage: "Specifies allowed operations for the certificate’s key like digitalSignature, keyEncipherment; typically a list of named flags.",
    extendedKeyUsage: "Defines more specific purposes such as server authentication or code signing; a list of named uses or object identifiers (OIDs).",
    certificatePolicies: "Policies or rules for how the certificate should be used; contains OIDs and optional human-readable descriptions.",
    crlDistributionPoints: "URLs where the Certificate Revocation List (CRL) can be fetched to check if the certificate is revoked; usually an array of URIs.",
    authorityKeyIdentifier: "Links this certificate to its issuer by referencing the issuer's public key identifier; typically a hash or key ID.",
    subjectKeyIdentifier: "A hash of the certificate's own public key; used to uniquely identify this certificate in a chain; usually a short hexadecimal string."
  };