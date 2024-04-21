import { useRef, useState,useEffect } from "react";
import { Template, checkTemplate, Lang } from "@pdfme/common";
import { Designer } from "@pdfme/ui";
import {
  getFontsData,
  getTemplate,
  readFile,
  cloneDeep,
  getPlugins,
  handleLoadTemplate,
  generatePDF,
  downloadJsonFile,
} from "./helper";

import dotenv from 'dotenv';
dotenv.config();
// const headerHeight = 65;
function App() {
  const designerRef = useRef<HTMLDivElement | null>(null);
  const designer = useRef<Designer | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [prevDesignerRef, setPrevDesignerRef] = useState<Designer | null>(null);
  const buildDesigner = () => {
    let template: Template = getTemplate();
    try {
      const templateString = localStorage.getItem("template");
      const templateJson = templateString
        ? JSON.parse(templateString)
        : getTemplate();
      checkTemplate(templateJson);
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
              'clear': '🗑️', // Add custom labels to consume them in your own plugins
            },
            
            theme: {
              token: {
                colorPrimary: '#5cb1ff',
              },
            },
          },
          plugins: getPlugins(),
        });
        designer.current.onSaveTemplate(onSaveTemplate);
      }
    });
  }

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

  const onDownloadTemplate = () => {
    if (designer.current) {
      downloadJsonFile(designer.current.getTemplate(), "template");
      console.log(designer.current.getTemplate());
    }
  };

  const onSaveTemplate = (template?: Template) => {
    if (designer.current) {
      localStorage.setItem(
        "template",
        JSON.stringify(template || designer.current.getTemplate())
      );
      alert("Saved!");
    }
  };

  const onResetTemplate = () => {
    if (designer.current) {
      designer.current.updateTemplate(getTemplate());
      localStorage.removeItem("template");
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
  // Function to fetch PDF data from API and update base PDF in Designer
  const fetchDataAndStore = async (): Promise<string | null> => {
    const id = extractIdFromCurrentUrl();
    const token = "process.env.TOKEN";
    if (!id) return null;

    try {
        const response = await fetch(`process.env.BASE_URL`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const blobData = await response.blob();
        
        // Convert binary data to base64
        const reader = new FileReader();
        reader.readAsDataURL(blobData);
    
        return new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            resolve(base64Data.split(',')[1]); // Extract base64 data (remove data URI prefix)
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

  // Function to extract the Id parameter from the URL
  const extractIdFromCurrentUrl = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    return id;
  };

  // Function to load PDF data from API and update base PDF in Designer
  const loadPDFDataAndUpdateBasePDF = async () => {
    try {
      const pdfData = await fetchDataAndStore(); // Fetch PDF data from API
      if (pdfData && designer.current) {
        // Update base PDF in Designer
        designer.current.updateTemplate(
          Object.assign(cloneDeep(designer.current.getTemplate()), {
            basePdf: pdfData,
          })
        );
      }
    } catch (error) {
      console.error('Error fetching PDF data:', error);
    }
  };

  useEffect(() => {
    loadPDFDataAndUpdateBasePDF(); // Call the function when component mounts
  }, []); 


  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginRight: 120, }}>
        {/* <span style={{ margin: "0 1rem" }}>/</span> */}
        <label style={{ width: 180 }}>
          Change BasePDF
          <input type="file" accept="application/pdf" onChange={onChangeBasePDF} />
        </label>
        <span style={{ margin: "0 1rem" }}>/</span>
        <label style={{ width: 180 }}>
          Load Template
          <input type="file" accept="application/json" onChange={(e) => handleLoadTemplate(e, designer.current)} />
        </label>
        <span style={{ margin: "0 1rem" }}>/</span>
        <button onClick={onDownloadTemplate}>Download Template</button>
        <span style={{ margin: "0 1rem" }}>/</span>
        <button onClick={() => onSaveTemplate()}>Save Template</button>
        <span style={{ margin: "0 1rem" }}>/</span>
        <button onClick={onResetTemplate}>Reset Template</button>
        <span style={{ margin: "0 1rem" }}>/</span>
        <button onClick={() => generatePDF(designer.current)}>Generate PDF</button>
      </header>
      <div ref={designerRef} style={{ width: '100%', height: `calc(100vh - ${headerHeight}px)` }} />
    </div>
  );
}

export default App;
