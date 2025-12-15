import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>

        <button onClick={handleRequest}>测试</button>

        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}


// async function handleRequest(request) {
//   try {
//     const edgeKV = new EdgeKV({ namespace: "demo" });
//     let getType = { type: "text" };
//     let value = await edgeKV.get("key", getType);
//     if (value === undefined) {
//       return "EdgeKV get: key not found";
//     } else {
//       return new Response(value);
//     }
//   } catch (e) {
//     return "EdgeKV get error" + e;
//   }
// }


async function handleRequest(request) {
  try {
    const edgeKV = new EdgeKV({ namespace: "demo" });
    let data = await edgeKV.put("put_string", "string_value")
    // await edgeKV.put("put_stream", new HTMLStream("test_stream", []));
    // await edgeKV.put("put_array_buffer", getArrayBuffer());
    // await edgeKV.put("put_array_buffer", new Response("test");
    if (data === undefined) {
      return "EdgeKV put success\n";
    } else {
      return "EdgeKV put failed\n";
    }
  } catch (e) {
    return "EdgeKV put error" + e;
  }
}


// async function handleRequest() {
//   try {
//     const edgeKV = new EdgeKV({ namespace: "demo" });
//     let resp = await edgeKV.delete("key");
//     if (resp) {
//       return "EdgeKV delete success";
//     } else {
//       return "EdgeKV delete failed";
//     }
//   }
//   catch (e) {
//     return "EdgeKV delete error" + e;
//   }
// }

export default App
