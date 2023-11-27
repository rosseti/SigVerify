import React, { useContext, useState, useEffect } from 'react';
import styles from './DocumentsPage.module.css';
import styled from 'styled-components';
import DocumentListFilter from './DocumentListFilter';
import DocumentViewer from './DocumentViewer';
import { AccountContext } from '../../App';

const OutterDocumentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: start;
  width: 100%;
  padding: 0px 10px;
  z-index: 10;
`;

const DocumentsHeader = styled.div`
  width: 100%;
  max-width: 600px;
  padding-inline: 20px;

  h1 {
    font-size: 1.5em;
    margin-bottom: 0px;
    margin-top: 4vh;
  }
`;

const DocumentSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;    
  gap: 10px;
  padding: 15px;
  width: 100%;
  max-width: 600px;
  margin-top: 14px;
  box-shadow: inset 2px 2px 2px 0px rgba(255, 255, 255, .5),
  inset 7px 7px 20px 0px rgba(0, 0, 0, .1),
  inset 4px 4px 5px 0px rgba(0, 0, 0, .1);
  border-radius: 10px;
  margin-bottom: 10vh;
`;

const DocumentDisplay = styled.div`
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 10px;
  padding: 16px;
  background-color: white;
  border-radius: 10px;

  div {
    min-width: 260px;
    max-width: 45%;
  }
`;

const ActiveDocInfo = styled.div`
  padding: 10px 5px;
  font-size: 14px;
  text-align: start;

  h4 {
    margin: 0px;
  }

  ul {
    list-style: none;
    padding: 0px;

    li {

      strong {
        color: teal;
      }
    }

    button {
      margin-top: 10px;
      font-size: 12px;
      padding: 6px 20px;
      border-radius: 5px;
      border: 1px solid black;;
      background-color: white;
      &:hover {
        background-color: white;
      }
    }
  }
`;

const NoDocumentsMessage = styled.p`
  font-size: 14px;
`;

function DocumentsPage() {
  const [accountObject, setAccountObject] = useContext(AccountContext);
  const [documents, setDocuments] = useState([]);
  const [documentCategoryInfo, setDocumentCategoryInfo] = useState({ name: "All" });
  const [currentDocument, setCurrentDocument] = useState(null);

  console.log("current document: ", currentDocument);

  async function convertSignedUrlToJsFileObject(url, filename) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type === "application/octet-stream" ? "text/plain" : blob.type });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    // Format the date and time in a readable format
    const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Combine date and time
    const readableDateTime = `${formattedDate} at ${formattedTime}`;

    return readableDateTime;
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/document/getAllDocuments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: accountObject.email }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log(data);
        if (!Array.isArray(data)) {
          setDocuments([]);
          return;
        }
        const formattedUserDocuments = data.map(async document => {
          const convertedDocument = await { ...document, File: await convertSignedUrlToJsFileObject(document.signedUrl, document.name) };
          return convertedDocument;
        });

        const resolvedFormattedUserDocuments = await Promise.all(formattedUserDocuments)

        console.log("formattedUserDocuments...", resolvedFormattedUserDocuments);
        setDocuments(resolvedFormattedUserDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, []); // Dependency array empty if you only want to run this once after the component mounts

  return (
    <OutterDocumentsContainer>
      <DocumentsHeader>
        <h1 className={styles.mainTitle}>Documents</h1>
        <p id={styles.pageDescription}>View all documents, filter by category.</p>
      </DocumentsHeader>

      <DocumentSection>
        <DocumentDisplay>
          {documents.length === 0 &&
            <NoDocumentsMessage>No documents found for this user.</NoDocumentsMessage>
          }
          {documents.length > 0 &&
            <DocumentListFilter documents={documents} options={["all documents", "signed documents", "unsigned documents"]} setCurrentDocument={setCurrentDocument} />
          }
          {currentDocument &&
            (
              <ActiveDocInfo>
                <h4>Current Document:</h4>
                <ul>
                  <li>name: <strong>{currentDocument.name}</strong></li>
                  <li>signed: <strong>{currentDocument.signed ? "true" : "false"}</strong></li>
                  <li>blockchain signature: <strong>{currentDocument.xrplTxHash ? currentDocument.xrplTxHash : "false"}</strong></li>
                  {/* <li>blockchain nft: <strong>false</strong></li> */}
                  <li>expires: <strong>{currentDocument.expires ? currentDocument.expires : "false"}</strong></li>
                  <li>uploaded: <strong>{currentDocument.uploaded ? formatDate(currentDocument.uploaded) : "null"}</strong></li>

                  <button className='buttonPop'>Sign</button>
                </ul>
              </ActiveDocInfo>
            )
          }
        </DocumentDisplay>
        <DocumentViewer currentDocument={currentDocument} />
      </DocumentSection>
    </OutterDocumentsContainer>
  );
};

export default DocumentsPage;
