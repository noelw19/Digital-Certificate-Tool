import img from "../images/pki.jpg"
import {Page} from "../components/pageWrapper"

export function Home() {
    return (
        <Page>
            <div className="w-full justify-center">
                <p className="text-2xl">Built using WASM and Golang</p>
            </div>
            <div className="w-full h-fit flex justify-center items-center">
                <img className="w-[50%] h-fit rounded" src={img} />
            </div>

            <div className="m-2 p-4">
                <h2 className="my-4 font-bold">What is a digital Certificate</h2>
                <p className="p-2">A digital certificate is an electronic credential issued by a trusted authority 
                    (called a Certificate Authority or CA) that verifies the identity of a person, organization, 
                    or device. It binds a public key to that identity, ensuring that communications using that key 
                    are secure and trustworthy.
                </p>

                <p className="text-left pl-2 font-bold py-4">Why it's important:</p>

                <ul className="text-left pl-6">
                    <li><span className="font-bold">Authentication:</span> Confirms the identity of a website, user, or device.</li>
                    <li><span className="font-bold">Encryption:</span> Enables secure data transmission using the public key.</li>
                    <li><span className="font-bold">Integrity:</span> Ensures data hasn't been tampered with in transit.</li>
                    <li><span className="font-bold">Trust:</span> Establishes confidence in online interactions, like browsing, email, or document signing.</li>
                </ul>
                <p className="my-4">In short, digital certificates are critical for secure communication and trust in digital systems.</p>
            </div>
        </Page>
    )
}