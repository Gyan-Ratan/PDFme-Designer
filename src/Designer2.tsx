import { useRef, useState,useEffect } from "react";
import { Template, checkTemplate, Lang } from "@pdfme/common";
// import { Designer } from "@pdfme/ui";
import { Designer, Form, Viewer } from '@pdfme/ui';
// import dotenv from 'dotenv';
// dotenv.config();
// const token = import.meta.env.TOKEN;


import {
  getFontsData,
  getTemplate,
  readFile,
  cloneDeep,
  getPlugins,
  // handleLoadTemplate,
  // generatePDF,
  downloadJsonFile,
} from "./helper";
// const headerHeight = 65;
// interface SignatureData {
//   x: number;
//   y: number;
//   imageData: string;
// }
// const secondPartySignatures: SignatureData[] = [];

function App() {

  const designerRef = useRef<HTMLDivElement | null>(null);
  const designer = useRef<Designer | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [prevDesignerRef, setPrevDesignerRef] = useState<Designer | null>(null);
  const [pdfFileData, setPdfFileData] = useState<string | null>(null);
  const buildDesigner = () => {
    let template: Template = getTemplate();
    try {
      const templateString = localStorage.getItem("template");
      const templateJson = templateString
        ? JSON.parse(templateString)
        : getTemplate();
      checkTemplate(templateJson);
      
      // const sampleData: { [key: string]: string }[] = templateJson.sampledata;
      // console.log(sampleData)
      template = templateJson as Template;
    } catch {
      localStorage.removeItem("template");
    }
    getFontsData().then((font) => {
      if (designerRef.current) {
        designer.current = new Designer({
          domContainer: designerRef.current,
          template,
          options: {
            font,
            lang,
            labels: {
              addNewField: 'ADD ELEMENT', // Update existing labels
              addSign:'ADD Sign',
              'clear': '🗑️', // Add custom labels to consume them in your own plugins
            },
            
            theme: {
              token: {
                colorPrimary: '#006fee',
              },
            },
          },
          plugins: getPlugins(),
        });
        designer.current.onSaveTemplate(onSaveTemplate);
      }
    });
  }
  const onSaveTemplate = (template?: Template) => {
    if (designer.current) {
      localStorage.setItem(
        "template",
        JSON.stringify(template || designer.current.getTemplate())
      );
      alert("Saved!");
    }
  };
  const onChangeBasePDF = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target && e.target.files) {
      readFile(e.target.files[0], "dataURL").then(async (basePdf) => {
        if (designer.current) {
          designer.current.updateTemplate(
            Object.assign(cloneDeep(designer.current.getTemplate()), {
              basePdf,
            })
          );
        }
      });
    }
  };


  if (designerRef != prevDesignerRef) {
    if (prevDesignerRef && designer.current) {
      designer.current.destroy();
    }
    buildDesigner();
    setPrevDesignerRef(designerRef);
  }
  const headerHeight = 65;
  
  
//? Function to fetch PDF data from API and update base PDF in Designer
  const fetchDataAndStore = async (): Promise<string | null> => {

    const id = extractIdFromCurrentUrl();
    if (!id || !token || !baseUrl) return null;

    try {
      const response = await fetch(`${baseUrl}/${id}/data`, {
        "method": "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
        }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        // console.log(response)
        const blobData = await response.blob();
       
        const pdfBlob = new Blob([blobData], { type: 'application/pdf' });
        // Convert binary data to base64
       
        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);
    
        return new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            resolve(base64Data); // Extract base64 data (remove data URI prefix)
            // console.log(base64Data);

            setPdfFileData(base64Data);
        };
          reader.onerror = () => {
            reject(new Error('Failed to read the binary data.'));
          };
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        return null;
      }
  };
  useEffect(() => {

   fetchDataAndStore(); 
  }, []);


  // Function to extract the Id parameter from the URL
  const extractIdFromCurrentUrl = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    return id;
  };

  // Function to load PDF data from API and update base PDF in Designer
  const loadPDFDataAndUpdateBasePDF = async () => {
    try {
      // const pdfData = await fetchDataAndStore(); // Fetch PDF data from API
      // console.log(pdfFileData)
      if (pdfFileData && designer.current) {
        // Update base PDF in Designer
        designer.current.updateTemplate(
          Object.assign(cloneDeep(designer.current.getTemplate()), {
            basePdf: pdfFileData,
          })
        );
      }
    } catch (error) {
      console.error('Error fetching PDF data:', error);
    }
  };


    loadPDFDataAndUpdateBasePDF(); // Call the function when component mounts

    const PatchSignature= () => {
        console.log("SUBMITTED")
    }

  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginRight: 120, }}>
        <span style={{ margin: "0 1rem" }}></span>
        <button onClick={() => PatchSignature()}>Submit Signature</button>
      </header>
      <div ref={designerRef} style={{ width: '100%', height: `calc(100vh - ${headerHeight}px)` }} />
    </div>
  );
}

export default App;
