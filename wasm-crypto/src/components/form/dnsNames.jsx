import { Button } from '../button';
import React from 'react';

export function collectDNS() {

}

export class DnsNames extends React.Component {
    constructor(props) {
        super();
        this.state = {
            dnsCount: 1,
            sans: "",
            caller: props.submit
        }
        this.addButton = this.addButton.bind(this)
        this.removeButton = this.removeButton.bind(this)
    }

    addButton() {
        return (
            <Button onClick={(e) => {
                e.preventDefault();
                if (this.state.dnsCount >= 5) return
                this.setState({ dnsCount: this.state.dnsCount + 1 })
            }}>+</Button>
        )
    }

    removeButton() {
        return (
            <Button onClick={(e) => {
                e.preventDefault();
                if (this.state.dnsCount <= 1) return
                this.setState({ dnsCount: this.state.dnsCount - 1 })
            }}>-</Button>
        )
    }

    getValues() {
        let dnsSans = document.querySelectorAll("#sans")

        dnsSans.length && dnsSans.forEach((v) => {
            this.setState({sans: this.state.sans + "," + v.textContent})
        })
    }

    isValidUrl(url) {
        const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([:/?#][^\s]*)?$/
        return urlRegex.test(url);
      }

    
    render() {
        return (
            <div className='my-4 border-y-2 py-4'>
                <p>DNS SANS</p>
                <div className="flex gap-2 justify-center">
                    <this.addButton />
                    <this.removeButton />
                </div>
                {Array(this.state.dnsCount).fill(1).map((x, y) => x + y).map((_, i) => {
                    return (
                        <div key={i} className="flex justify-center mb-2">
                            {/* <InputComponent id="sans" label={`DNS SANS #${i + 1}`} placeholder={"www.example.com"} name="Sans" /> */}
                            <label className="p-2">{`DNS SANS #${i + 1}`}:</label>
                            <input id={`sans`} 
                                pattern="(?:(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)(?:\.(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)*(?:\.(?:[a-zA-Z\u00a1-\uffff]{2,}))(?::\d{2,5})?(?:\/[^\s]*)?" 
                                onChange={e => {
                                let el = document.querySelector(`.sans-${i + 1}`)
                                if(this.isValidUrl(e.target.value)) {
                                    // el.classList.add("bg-red-400")
                                    el.style.color = "green"
                                } else {
                                    el.style.color = "red"
                                }
                            }} className={`sans-${i + 1} block w-[50%] rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-gray-600 sm:text-sm/6`} name={"Sans"} placeholder={"Enter DNS Sans"}></input>
        
                        </div>
                    )
                })}
            </div>
        )
    }
}