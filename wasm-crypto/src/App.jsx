import './App.css'
import './wasm_exec';
import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router';

import { Home } from './routes/home.jsx';
import { CreateCA } from './routes/createca.jsx';
import { CreateCert } from './routes/createCert.jsx';
import { Button } from './components/button.jsx';
import { CreateCSR } from './routes/createcsr.jsx';
import { DecodePEMRoute } from './routes/decodepem.jsx';
import { ValidateCert } from './routes/validate.jsx';



function App() {
  const [isWasmLoaded, setIsWasmLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate()
  // const [wasmResult, setWasmResult] = useState(null);
  function NavButton({ content, link }) {
    return <p className='p-2 text-sm md:text-sm bg-gray-500 text-white hover:cursor-pointer hover:bg-gray-700' onClick={() => navigate(link)}>{content}</p>
  }

  // useEffect hook to load WebAssembly when the component mounts
  useEffect(() => {
    // Function to asynchronously load WebAssembly
    async function loadWasm() {
      if (window.wasm) return
      // Create a new Go object
      const goWasm = new window.Go();
      const result = await WebAssembly.instantiateStreaming(
        // Fetch and instantiate the main.wasm file
        fetch('/main.wasm'),
        // Provide the import object to Go for communication with JavaScript
        goWasm.importObject
      );
      // Run the Go program with the WebAssembly instance
      goWasm.run(result.instance);
      window.wasm = true
      setIsWasmLoaded(true);
    }

    loadWasm();
  }, []);



  if (isWasmLoaded) {
    console.log("wasm loaded")
  }

  return (
    <div className='w-full h-full flex flex-col overflow-hidden'>
      <h2 className='pb-8 mb-4 w-full align-middle p-2 border-b-4 text-4xl border-white font-bold hover:cursor-pointer' onClick={() => navigate("/")}><span className='text-green-600'>D</span>igital <span className='text-yellow-500'>C</span>ertificate <span className='text-red-500'>T</span>ool</h2>
      <div className='flex h-[95%]'>
        <div className='w-[40%] md:w-[20%] h-[95%] border-r-4 border-white flex flex-col pt-2 pr-2 gap-2'>
          <NavButton content="Create Ca Cert" link="createca" />
          <NavButton content="Create Server Cert" link="createcert/?type=server" />
          <NavButton content="Create Client Cert" link="createcert/?type=client" />
          <div className='my-2'></div>
          <NavButton content="Create CSR" link="createcsr" />
          <NavButton content="Validate Cert" link="validate" />
          <div className='my-2'></div>
          <NavButton content="Decode PEM" link="decode/pem" />

        </div>

        <div className='w-full bg-gray-100 pt-4 h-[95%] overflow-scroll text-black'>
          <Routes>
            <Route index element={<Home setModal={setIsModalOpen} />} />
            <Route path="createca" element={<CreateCA setModal={setIsModalOpen} />} />
            <Route path="createcert" element={<CreateCert setModal={setIsModalOpen} />} />
            <Route path="createcert" element={<CreateCert setModal={setIsModalOpen} />} />
            <Route path="createcsr" element={<CreateCSR setModal={setIsModalOpen} />} />
            <Route path="decode/pem" element={<DecodePEMRoute setModal={setIsModalOpen}/>} />
            <Route path="validate" element={<ValidateCert setModal={setIsModalOpen}/>} />
          </Routes>
        </div>
      </div>
      <div className={`w-full h-full absolute bg-gray-500 opacity-50 z-10 ${isModalOpen ? "visible" : "invisible"}`}>

      </div>
      <div className={`rounded absolute text-white w-full h-full flex flex-col justify-center items-center z-12 p-2  ${isModalOpen ? "visible" : "invisible"}`}>
        <div className='bg-gray-700 w-[50%] h-[20%] flex flex-col justify-around items-center px-6 py-4'>
          <p>{isModalOpen.data}</p>
          <Button noBottomMargin={true} onClick={() => isModalOpen.click ? isModalOpen.click() : setIsModalOpen(false)}>Close</Button>
        </div>
      </div>

    </div>
  )
}

export default App
