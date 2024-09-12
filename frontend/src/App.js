import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [pythonFile, setPythonFile] = useState(null);
  const [imageName, setImageName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');

  const handleFileChange = (e) => {
    setPythonFile(e.target.files[0]);
    setFileError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pythonFile) {
      setFileError("Please upload a Python file!");
      return;
    }

    setLoading(true);
    setError('');
    setOutput(null);

    const formData = new FormData();
    formData.append('file', pythonFile);
    formData.append('image_name', imageName);
    formData.append('endpoint', endpoint);

    try {
      const response = await axios.post("http://localhost:5000/build_and_run", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response.data.urls);
      setOutput(response.data.urls);
    } catch (err) {
      console.error('API Error:', err);
      if (err.response) {
        console.log(err.response)
        setError(err.response.data.error || 'An error occurred while processing your request.');
      } else if (err.request) {
        setError('No response received from the server. Please try again later.');
      } else {
        setError('An error occurred while sending the request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderOutput = () => {
    if (!output || !Array.isArray(output)) return null;
  
    return (
      <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
        <h2 className="text-xl font-semibold mb-2">Success!</h2>
        <p>Your Python file Image has been created and Containerized successfully.</p>
        {output.map((item, index) => (
          <div key={index} className="mt-4">
            {item && (
              <p className="mt-2 break-all">
                Docker image URL: <a href={item} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">{item}</a>
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Automated Docker Image Creation</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Image Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700">API Endpoint</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-center items-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-400 p-4 cursor-pointer hover:bg-gray-200 transition duration-300">
            <input
              type="file"
              className="hidden"
              id="fileInput"
              onChange={handleFileChange}
              accept=".py"
            />
            <label htmlFor="fileInput" className="flex flex-col items-center justify-center cursor-pointer">
              <svg
                className="w-10 h-10 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16V8a4 4 0 014-4h2a4 4 0 014 4v8m-5 4h.01"
                />
              </svg>
              <span className="mt-2 text-gray-600">Drag and drop a file or click to upload</span>
              {pythonFile && (
                <span className="mt-1 text-blue-500">{pythonFile.name}</span>
              )}
            </label>
          </div>

          {fileError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{fileError}</span>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2 mt-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold rounded-md shadow-lg transform hover:scale-105 hover:from-blue-500 hover:to-blue-700 transition duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-blue-600">Processing your file...</p>
          </div>
        )}

        {renderOutput()}

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative overflow-hidden" role="alert">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="break-words">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;