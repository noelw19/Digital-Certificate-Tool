package main

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"syscall/js"
	"time"

	"slices"
)

func main() {
	// Create a channel to keep the Go program alive
	done := make(chan struct{}, 0)

	// Expose the Go function `fibonacciSum` to JavaScript
	// js.Global().Set("wasmFibonacciSum", js.FuncOf(fibonacciSum))
	js.Global().Set("createCaCertificate", js.FuncOf(createCaCertificate))
	js.Global().Set("createCertificate", js.FuncOf(createCertificate))
	js.Global().Set("decodePEM", js.FuncOf(decodePEM))
	js.Global().Set("createCSR", js.FuncOf(createCSR))
	js.Global().Set("validateCertificate", js.FuncOf(validateCert))

	// Block the program from exiting
	<-done
}

type BaseInput struct {
	commonName   string
	organisation string
	country      string
	locality     string
	street       string
	postCode     string
}

// takes first 6 arguments
func (b *BaseInput) populate(p []js.Value) {
	b.commonName = p[0].String()
	b.organisation = p[1].String()
	b.country = p[2].String()
	b.locality = p[3].String()
	b.street = p[4].String()
	b.postCode = p[5].String()

	if b.commonName == "null" {
		b.commonName = "Big Turkey"
	}
	if b.country == "null" {
		b.country = "NZ"
	}
	if b.locality == "null" {
		b.locality = "Opotiki"
	}
	if b.street == "null" {
		b.street = "Tarawera Drive"
	}
	if b.organisation == "null" {
		b.organisation = "Turkey Burgers LTD"
	}
	if b.postCode == "null" {
		b.postCode = "1337"
	}
}

func createCaCertificate(this js.Value, p []js.Value) any {
	input := &BaseInput{}
	input.populate(p)

	dns := p[6].String()
	ku := p[7].String()

	cleanedDNS := []string{}
	if dns != "null" {
		cleanedDNS = strings.Split(dns, ",")
	}

	KU := &KeyUsages{
		raw: ku,
	}

	KU.parse()

	serial := generateSerialNumber()

	caTemplate := &x509.Certificate{
		SerialNumber: serial,
		Subject: pkix.Name{
			Organization:  []string{input.organisation},
			Country:       []string{input.country},
			Locality:      []string{input.locality},
			StreetAddress: []string{input.street},
			PostalCode:    []string{input.postCode},
			CommonName:    input.commonName,
		},
		IsCA:                  true,
		NotBefore:             time.Now(),
		NotAfter:              time.Now().AddDate(10, 0, 0),
		KeyUsage:              KU.result,
		DNSNames:              cleanedDNS,
		BasicConstraintsValid: true,
	}

	caPrivKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return err
	}

	pubKeyHash, err := hashPublicKey(&caPrivKey.PublicKey)
	if err != nil {
		fmt.Println("Error hashing public key: ", err)
	} else {
		caTemplate.SubjectKeyId = pubKeyHash
	}

	caBytes, err := x509.CreateCertificate(rand.Reader, caTemplate, caTemplate, &caPrivKey.PublicKey, caPrivKey)
	if err != nil {
		return err
	}

	caPEM := new(bytes.Buffer)
	pem.Encode(caPEM, &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: caBytes,
	})

	caPrivKeyPEM := new(bytes.Buffer)
	pem.Encode(caPrivKeyPEM, &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(caPrivKey),
	})

	return js.ValueOf(map[string]interface{}{
		"caPEM": caPEM.String(),
		"Priv":  caPrivKeyPEM.String(),
	})
}

type KeyUsages struct {
	raw    string
	result x509.KeyUsage
}

type ExtKeyUsages struct {
	raw    string
	result []x509.ExtKeyUsage
}

var Ku = []string{"digitalsignature", "contentcommitment", "keyencipherment", "dataencipherment", "keyagreement", "certsign", "crlsign", "encipheronly"}
var Ku_x509 = []x509.KeyUsage{x509.KeyUsageDigitalSignature, x509.KeyUsageContentCommitment, x509.KeyUsageKeyEncipherment, x509.KeyUsageDataEncipherment, x509.KeyUsageKeyAgreement, x509.KeyUsageCertSign, x509.KeyUsageCRLSign, x509.KeyUsageEncipherOnly}
var ExtKu = []string{"webserverauth", "webclientauth", "codesigning", "emailprotection", "timestamping", "ocspsigning"}
var ExtKu_x509 = []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth, x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageCodeSigning, x509.ExtKeyUsageEmailProtection, x509.ExtKeyUsageTimeStamping, x509.ExtKeyUsageOCSPSigning}

func (k *KeyUsages) parse() {
	if k.raw == "" {
		return
	}
	usagesArr := strings.Split(k.raw, ",")
	for _, v := range usagesArr {
		indexOfKeyUsage := slices.Index(Ku, v)
		// k.result = x509.KeyUsageCRLSign
		current := Ku_x509[indexOfKeyUsage]
		k.result = k.result | current
	}
}

func (ext *ExtKeyUsages) parse() {
	if ext.raw == "" {
		return
	}
	usagesArr := strings.Split(ext.raw, ",")
	for _, v := range usagesArr {
		indexOfKeyUsage := slices.Index(ExtKu, v)
		// k.result = x509.KeyUsageCRLSign
		current := ExtKu_x509[indexOfKeyUsage]
		ext.result = append(ext.result, current)
	}
}

func createCertificate(this js.Value, p []js.Value) any {
	input := &BaseInput{}
	input.populate(p)

	caCrt := p[6].String()
	caKey := p[7].String()
	dns := p[8].String()
	keyUsages := p[9].String()

	extKeyUsages := p[10].String()
	KU := &KeyUsages{
		raw: keyUsages,
	}
	EKU := &ExtKeyUsages{
		raw: extKeyUsages,
	}

	KU.parse()
	EKU.parse()

	caCert, err := tls.X509KeyPair([]byte(caCrt), []byte(caKey))
	if err != nil {
		fmt.Println("Error loading CA Key pair: ", err)
		return js.ValueOf(map[string]interface{}{
			"error": err,
		})
	}

	cleanedDNS := []string{}
	if dns != "null" {
		cleanedDNS = strings.Split(dns, ",")
	}

	serial := generateSerialNumber()

	cert := &x509.Certificate{
		SerialNumber: serial,
		Subject: pkix.Name{
			Organization:  []string{input.organisation},
			Country:       []string{input.country},
			Locality:      []string{input.locality},
			StreetAddress: []string{input.street},
			PostalCode:    []string{input.street},
			CommonName:    input.commonName,
		},
		NotBefore:   time.Now(),
		NotAfter:    time.Now().AddDate(10, 0, 0),
		ExtKeyUsage: EKU.result,
		KeyUsage:    KU.result,
		DNSNames:    cleanedDNS,
	}

	certKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		fmt.Printf("Generate the Key error: %v\n", err)
		return err
	}

	pubKeyHash, err := hashPublicKey(&certKey.PublicKey)
	if err != nil {
		fmt.Println("Error hashing public key: ", err)
	} else {
		cert.SubjectKeyId = pubKeyHash
	}

	certBytes, err := x509.CreateCertificate(rand.Reader, cert, &x509.Certificate{Raw: caCert.Leaf.Raw, Subject: cert.Subject}, &certKey.PublicKey, certKey)
	if err != nil {
		fmt.Printf("Generate the certificate error: %v\n", err)
		return err
	}

	certPEM := new(bytes.Buffer)
	pem.Encode(certPEM, &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: certBytes,
	})

	certKeyPEM := new(bytes.Buffer)
	pem.Encode(certKeyPEM, &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(certKey),
	})

	return js.ValueOf(map[string]interface{}{
		"cert": certPEM.String(),
		"key":  certKeyPEM.String(),
	})
}

func decodePEM(this js.Value, p []js.Value) any {
	pemData := p[0].String()
	returnData := map[string]any{}

	block, _ := pem.Decode([]byte(pemData))

	if block == nil {
		fmt.Println("failed to decode PEM block containing public key")
		returnData["message"] = "failed to decode PEM block containing public key"
		return js.ValueOf(returnData)
	}

	switch block.Type {
	case "CERTIFICATE":
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			fmt.Println("Error parsing certificate PEM: ", err)
		}
		returnData["type"] = block.Type
		returnData["commonName"] = cert.Subject.CommonName
		returnData["country"] = cert.Subject.Country[0]
		returnData["organisation"] = cert.Subject.Organization[0]
		returnData["locality"] = cert.Subject.Locality[0]
		returnData["street"] = cert.Subject.StreetAddress[0]
		returnData["issuer"] = cert.Issuer.CommonName
		returnData["isCA"] = cert.IsCA
		returnData["serialnumber"] = cert.SerialNumber.String()
		returnData["notAfter"] = cert.NotAfter.String()
		returnData["notBefore"] = cert.NotBefore.String()

		returnData["keyUsages"] = usageToString(cert.KeyUsage)
		extusages := []string{}

		for _, usage := range cert.ExtKeyUsage {
			usage := extUsageToString(usage)
			extusages = append(extusages, usage)
		}

		returnData["extUsages"] = strings.Join(extusages, ", ")

		dns := []string{}
		for _, v := range cert.DNSNames {
			dns = append(dns, v)
		}
		returnData["dnsNames"] = strings.Join(dns, ", ")

	case "RSA PRIVATE KEY":
		key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
		if err != nil {
			fmt.Println("Error parsing private key: ", err)
		}

		// Get the DER encoded form of the private key
		privateKeyBytes, err := x509.MarshalPKCS8PrivateKey(key)
		if err != nil {
			fmt.Println("Error marshaling private key: ", err)
		}

		public := x509.MarshalPKCS1PublicKey(&key.PublicKey)
		// Encode the DER bytes to a hex string
		privateKeyHex := hex.EncodeToString(privateKeyBytes)
		publicKeyHex := hex.EncodeToString(public)
		returnData["type"] = block.Type
		returnData["privateKey"] = privateKeyHex
		returnData["publicKey"] = publicKeyHex
	default:
		returnData["type"] = "unknown"
		returnData["unknownType"] = block.Type
	}

	return js.ValueOf(returnData)
}

type Cert struct {
	*x509.Certificate
	results map[string]any
}

func isUnknownCAError(err error) bool {
    var unkownCAError x509.UnknownAuthorityError
    return errors.As(err, &unkownCAError)
}

func(c *Cert) validate() {

	today := time.Now()
	if today.After(c.NotAfter) {
		c.results["Check-Expiry"] = fmt.Sprintf("Certificate has expired: %s", c.NotAfter.String())
	}
	if today.Before(c.NotBefore) {
		c.results["Check-Issue"] = fmt.Sprintf("Certificate issue date yet to arrive: %s", c.NotBefore.String())
	}


	chains, err := c.Verify(x509.VerifyOptions{})
	if err != nil {
		if isUnknownCAError(err) {
			c.results["Check-CA"] = fmt.Sprintf("Certificate is signed by an unknown CA: %s", c.Issuer.String())
		}
		fmt.Println("Error using built in cert verify: ", err)
	}

	fmt.Printf("\n %+v \n", chains)
	

	// still working on validation logic
}

func validateCert(this js.Value, p []js.Value) any {
	pemData := p[0].String()
	
	returnData := map[string]any{}

	block, _ := pem.Decode([]byte(pemData))

	if block == nil {
		fmt.Println("failed to decode PEM block containing public key")
		returnData["message"] = "failed to decode PEM block containing public key"
		return js.ValueOf(returnData)
	}

	var parsedCert Cert
	switch block.Type {
	case "CERTIFICATE":
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			fmt.Println("Error parsing certificate PEM: ", err)
		}

		parsedCert = Cert{
			cert,
			map[string]any{},
		}
		
		parsedCert.results["type"] = block.Type
		parsedCert.results["commonName"] = cert.Subject.CommonName
		parsedCert.results["country"] = cert.Subject.Country[0]
		parsedCert.results["organisation"] = cert.Subject.Organization[0]
		parsedCert.results["locality"] = cert.Subject.Locality[0]
		parsedCert.results["street"] = cert.Subject.StreetAddress[0]
		parsedCert.results["issuer"] = cert.Issuer.CommonName
		parsedCert.results["isCA"] = cert.IsCA
		parsedCert.results["serialnumber"] = cert.SerialNumber.String()
		parsedCert.results["notAfter"] = cert.NotAfter.String()
		parsedCert.results["notBefore"] = cert.NotBefore.String()

		parsedCert.results["keyUsages"] = usageToString(cert.KeyUsage)
		extusages := []string{}

		for _, usage := range cert.ExtKeyUsage {
			usage := extUsageToString(usage)
			extusages = append(extusages, usage)
		}

		parsedCert.results["extUsages"] = strings.Join(extusages, ", ")

		dns := []string{}
		for _, v := range cert.DNSNames {
			dns = append(dns, v)
		}
		parsedCert.results["dnsNames"] = strings.Join(dns, ", ")
		
		

		parsedCert.validate()

	default:
		parsedCert := &Cert{
			results: map[string]any{},
		}
		parsedCert.results["type"] = "unknown"
		parsedCert.results["unknownType"] = block.Type
	}

	return js.ValueOf(parsedCert.results)
}

func createCSR(this js.Value, p []js.Value) any {
	fmt.Println("Running createCSR")
	input := &BaseInput{}
	input.populate(p)

	privKey := p[6].String()
	dns := p[7].String()

	// Generate a private key
	privKeys, _ := rsa.GenerateKey(rand.Reader, 2048)

	var key *rsa.PrivateKey
	if privKey == "null" {
		key = privKeys
	} else {
		keyVal, err := stringToPrivateKey(privKey)
		if err != nil {
			key = privKeys
		} else {
			key = keyVal
		}
	}

	cleanedDNS := []string{}
	if dns != "null" {
		cleanedDNS = strings.Split(dns, ",")
	}

	template := x509.CertificateRequest{
		Subject: pkix.Name{
			Organization:  []string{input.organisation},
			Country:       []string{input.country},
			Locality:      []string{input.locality},
			StreetAddress: []string{input.street},
			PostalCode:    []string{input.street},
			CommonName:    input.commonName,
		},
		DNSNames: cleanedDNS,
	}

	// Create CSR
	csrDER, _ := x509.CreateCertificateRequest(rand.Reader, &template, key)

	// Encode CSR to PEM
	csrPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "CERTIFICATE REQUEST",
		Bytes: csrDER,
	})

	// Encode private key to PEM
	keyPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(key),
	})

	// return csrPEM, keyPEM, nil
	returnData := map[string]any{
		"csr": string(csrPEM),
		"key": string(keyPEM),
	}

	return js.ValueOf(returnData)
}

func hashPublicKey(publicKey *rsa.PublicKey) ([]byte, error) {
	publicKeyBytes, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		return nil, err
	}

	hash := sha256.Sum256(publicKeyBytes)
	return hash[:], nil
}

func generateSerialNumber() *big.Int {
	// Limit serial number to 128 bits to avoid compatibility issues.
	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	serialNumber, _ := rand.Int(rand.Reader, serialNumberLimit)
	return serialNumber
}

func stringToPrivateKey(privKey string) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode([]byte(privKey))
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block containing private key")
	}

	key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	return key, nil
}

func usageToString(usage x509.KeyUsage) string {
	usages := []string{}

	if usage&x509.KeyUsageDigitalSignature != 0 {
		usages = append(usages, "Digital Signature")
	}
	if usage&x509.KeyUsageContentCommitment != 0 {
		usages = append(usages, "Content Commitment")
	}
	if usage&x509.KeyUsageKeyEncipherment != 0 {
		usages = append(usages, "Key Encipherment")
	}
	if usage&x509.KeyUsageDataEncipherment != 0 {
		usages = append(usages, "Data Encipherment")
	}
	if usage&x509.KeyUsageKeyAgreement != 0 {
		usages = append(usages, "Key Agreement")
	}
	if usage&x509.KeyUsageCertSign != 0 {
		usages = append(usages, "Cert Sign")
	}
	if usage&x509.KeyUsageCRLSign != 0 {
		usages = append(usages, "CRL Sign")
	}
	if usage&x509.KeyUsageEncipherOnly != 0 {
		usages = append(usages, "Encipher Only")
	}
	if usage&x509.KeyUsageDecipherOnly != 0 {
		usages = append(usages, "Decipher Only")
	}
	if len(usages) == 0 {
		return "None"
	}
	return strings.Join(usages, ", ")
}

func extUsageToString(usage x509.ExtKeyUsage) string {
	switch usage {
	case x509.ExtKeyUsageAny:
		return "Any"
	case x509.ExtKeyUsageServerAuth:
		return "Server Authentication"
	case x509.ExtKeyUsageClientAuth:
		return "Client Authentication"
	case x509.ExtKeyUsageCodeSigning:
		return "Code Signing"
	case x509.ExtKeyUsageEmailProtection:
		return "Email Protection"
	case x509.ExtKeyUsageIPSECEndSystem:
		return "IPSec End System"
	case x509.ExtKeyUsageIPSECTunnel:
		return "IPSec Tunnel"
	case x509.ExtKeyUsageIPSECUser:
		return "IPSec User"
	case x509.ExtKeyUsageTimeStamping:
		return "Time Stamping"
	case x509.ExtKeyUsageOCSPSigning:
		return "OCSP Signing"
	case x509.ExtKeyUsageMicrosoftServerGatedCrypto:
		return "Microsoft Server Gated Crypto"
	case x509.ExtKeyUsageNetscapeServerGatedCrypto:
		return "Netscape Server Gated Crypto"
	case x509.ExtKeyUsageMicrosoftCommercialCodeSigning:
		return "Microsoft Commercial Code Signing"
	case x509.ExtKeyUsageMicrosoftKernelCodeSigning:
		return "Microsoft Kernel Code Signing"
	default:
		return fmt.Sprintf("Unknown Extended Key Usage: %d", usage)
	}
}
