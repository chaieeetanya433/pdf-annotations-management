import axios from 'axios';
import { API_BASE_URL } from './config';

export const uploadPDF = async (file, processId, formId) => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('process_id', processId);
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

export const fetchAnnotations = async (processId, formId) => {
    const response = await axios.post(
        `${API_BASE_URL}/api/fetch-create-table/`,
        { process_id: processId, form_id: formId }
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