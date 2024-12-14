import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadDocument = async (file, title) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    const response = await api.post('/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.response?.data?.error || 'Failed to upload document');
  }
};

export const analyzeDocument = async (documentId) => {
  try {
    const response = await api.post(`/documents/${documentId}/analyze/`);
    
    if (!response.data || !response.data.fee_perspective_analysis) {
      throw new Error('Invalid analysis data received from server');
    }
    
    return response.data;
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(error.response?.data?.error || 'Failed to analyze document');
  }
};

export const getDocuments = async () => {
  try {
    const response = await api.get('/documents/');
    // Handle both paginated and non-paginated responses
    return response.data.results || response.data || [];
  } catch (error) {
    console.error('Get documents error:', error);
    if (error.response?.status === 404) {
      return []; // Return empty array for no documents
    }
    throw new Error(error.response?.data?.error || 'Failed to load documents');
  }
};

export const getAnalysis = async (analysisId) => {
  try {
    const response = await api.get(`/analyses/${analysisId}/`);
    return response.data;
  } catch (error) {
    console.error('Get analysis error:', error);
    throw new Error(error.response?.data?.error || 'Failed to load analysis');
  }
};

export const sendChatMessage = async (documentId, message) => {
  try {
    let response;
    
    if (documentId) {
      // Chat with document context
      response = await api.post(`/documents/${documentId}/chat/`, 
        { message: message },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    } else {
      // Chat without document context
      response = await api.post('/chat/', 
        { message: message },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    if (!response.data || !response.data.conversation) {
      throw new Error('Invalid response format from server');
    }
    
    return response.data;
  } catch (error) {
    console.error('Chat error:', error.response || error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to send message';
    throw new Error(errorMessage);
  }
};

export const getDocumentConversations = async (documentId) => {
  try {
    if (!documentId) {
      return []; // Return empty array for non-document chat
    }
    
    const response = await api.get(`/documents/${documentId}/conversations/`);
    return response.data;
  } catch (error) {
    console.error('Get conversations error:', error);
    throw new Error(error.response?.data?.error || 'Failed to load conversations');
  }
};

// New helper function to handle file uploads within chat
export const uploadDocumentInChat = async (file) => {
  try {
    const title = file.name.replace('.pdf', '');
    const document = await uploadDocument(file, title);
    const analysis = await analyzeDocument(document.id);
    
    return {
      document,
      analysis: analysis.fee_perspective_analysis
    };
  } catch (error) {
    console.error('Upload and analysis error:', error);
    throw new Error(error.message || 'Failed to process document');
  }
};

// Function to get conversation history (useful for pagination or lazy loading)
export const getChatHistory = async (documentId, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    const url = documentId 
      ? `/documents/${documentId}/conversations/?${params}`
      : `/conversations/?${params}`;
      
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Get chat history error:', error);
    throw new Error(error.response?.data?.error || 'Failed to load chat history');
  }
};