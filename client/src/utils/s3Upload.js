import { fetchWithAuth } from './auth';

const API_BASE_URL = 'http://localhost:5001/api';

export const uploadDocument = async (file, employeeId, documentType) => {
  try {
    console.log('Starting document upload process...');
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // First, get the pre-signed URL from the server
    console.log('Requesting pre-signed URL...');
    const response = await fetchWithAuth(`${API_BASE_URL}/employees/${employeeId}/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        documentType
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to get upload URL:', errorData);
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(errorData.error || 'Failed to get upload URL');
    }

    const { uploadUrl, fileUrl } = await response.json();
    console.log('Received pre-signed URL:', uploadUrl);

    // Upload the file to S3 using the pre-signed URL
    console.log('Uploading file to S3...');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadResponse.ok) {
      console.error('Failed to upload to S3:', await uploadResponse.text());
      throw new Error('Failed to upload file to S3. Please try again.');
    }

    console.log('File uploaded to S3 successfully');

    // Update the employee record with the new document URL
    console.log('Updating employee record...');
    const updateResponse = await fetchWithAuth(`${API_BASE_URL}/employees/${employeeId}/documents`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentType,
        fileUrl
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Failed to update employee record:', errorData);
      throw new Error(errorData.error || 'Failed to update employee record');
    }

    console.log('Employee record updated successfully');
    return fileUrl;
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    if (error.message.includes('AWS credentials')) {
      throw new Error('Server configuration error. Please contact support.');
    }
    throw error;
  }
};

export const deleteDocument = async (employeeId, documentType) => {
  try {
    console.log('Starting document deletion process...');
    const response = await fetchWithAuth(`${API_BASE_URL}/employees/${employeeId}/documents/${documentType}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to delete document:', errorData);
      throw new Error(errorData.error || 'Failed to delete document');
    }

    console.log('Document deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    throw error;
  }
}; 