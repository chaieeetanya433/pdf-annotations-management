import axios from 'axios';
import { API_BASE_URL } from './config';

export const uploadPDF = async (file, formId) => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('form_id', formId);

    const response = await axios.post(`${API_BASE_URL}/api/upload-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const saveAnnotations = async (annotations) => {
    const response = await axios.post(
        `${API_BASE_URL}/api/pdf-annotation-mappings/bulk/`,
        annotations
    );
    return response.data;
};

export const fetchAnnotations = async (formId) => {
    const response = await axios.post(
        `${API_BASE_URL}/api/fetch-create-table/`,
        { form_id: formId }
    );
    return response.data;
};

export const updateAnnotation = async (id, data) => {
    const response = await axios.put(
        `${API_BASE_URL}/api/pdf-annotation-mappings/${id}`,
        data
    );
    return response.data;
};

export const deleteAnnotation = async (id) => {
    const response = await axios.delete(
        `${API_BASE_URL}/api/pdf-annotation-mappings/${id}`
    );
    return response.data;
};

export const createDocument = async (documentData) => {
    const response = await axios.post(
        `${API_BASE_URL}/api/documents`,
        documentData
    );
    console.log('response of createDocument: ', response);
    return response.data;
};

export const getAllDocuments = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/documents`);
    return response.data;
};

export const getDocumentWithAnnotations = async (documentId) => {
    const response = await axios.get(
        `${API_BASE_URL}/api/documents/${documentId}`
    );
    return response.data;
};

export const deleteDocument = async (documentId) => {
    const response = await axios.delete(
        `${API_BASE_URL}/api/documents/${documentId}`
    );
    return response.data;
};