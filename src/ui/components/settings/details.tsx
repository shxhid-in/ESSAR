import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface DetailsProps {
  initialValues?: {
    company_name?: string;
    company_contact_details?: string;
    company_address?: string;
    thank_you_note?: string;
    primary_logo_path?: string;
    secondary_logo_path?: string;
    seal_photo_path?: string;
  };
}

export default function Details({ initialValues = {} }: DetailsProps) {
  const queryClient = useQueryClient();
  type UploadTarget = 'primary' | 'secondary' | 'seal' | null;
  
  // Fetch settings from database
  const { data: settings, isLoading: isLoadingSettings } = useQuery(
    ['settings'],
    () => (window.electronAPI as any).getSettings(),
    {
      staleTime: 0, // Always fetch fresh data
      cacheTime: 0
    }
  );

  // Initialize state from settings data
  const [companyName, setCompanyName] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [thankYouNote, setThankYouNote] = useState('THANKS FOR DOING BUSINESS WITH US');
  const [primaryLogoPath, setPrimaryLogoPath] = useState('');
  const [secondaryLogoPath, setSecondaryLogoPath] = useState('');
  const [sealPhotoPath, setSealPhotoPath] = useState('');
  const [primaryLogoBase64, setPrimaryLogoBase64] = useState('');
  const [secondaryLogoBase64, setSecondaryLogoBase64] = useState('');
  const [sealPhotoBase64, setSealPhotoBase64] = useState('');
  const [uploadingTarget, setUploadingTarget] = useState<UploadTarget>(null);
  const [uploadMessage, setUploadMessage] = useState('');

  // Update state when settings data loads
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || '');
      setContactDetails(settings.company_contact_details || '');
      setCompanyAddress(settings.company_address || '');
      setThankYouNote(settings.thank_you_note || 'THANKS FOR DOING BUSINESS WITH US');
      setPrimaryLogoPath(settings.primary_logo_path || '');
      setSecondaryLogoPath(settings.secondary_logo_path || '');
      setSealPhotoPath(settings.seal_photo_path || '');
    }
  }, [settings]);

  // Load logo base64 when logo path changes
  useEffect(() => {
    const loadLogos = async () => {
      if (primaryLogoPath) {
        try {
          const base64 = await (window.electronAPI as any).getPrimaryLogoBase64();
          setPrimaryLogoBase64(base64 || '');
        } catch (error) {
          console.error('Failed to load primary logo:', error);
          setPrimaryLogoBase64('');
        }
      } else {
        setPrimaryLogoBase64('');
      }
      
      if (secondaryLogoPath) {
        try {
          const base64 = await (window.electronAPI as any).getSecondaryLogoBase64();
          setSecondaryLogoBase64(base64 || '');
        } catch (error) {
          console.error('Failed to load secondary logo:', error);
          setSecondaryLogoBase64('');
        }
      } else {
        setSecondaryLogoBase64('');
      }
      
      if (sealPhotoPath) {
        try {
          const base64 = await (window.electronAPI as any).getSealPhotoBase64();
          setSealPhotoBase64(base64 || '');
        } catch (error) {
          console.error('Failed to load seal photo:', error);
          setSealPhotoBase64('');
        }
      } else {
        setSealPhotoBase64('');
      }
    };
    
    loadLogos();
  }, [primaryLogoPath, secondaryLogoPath, sealPhotoPath]);

  const { mutate: updateSettings, isLoading } = useMutation(
    async (settingsToUpdate: any) => {
      // The preload already wraps it in { settings: ... }, so pass directly
      const result = await (window.electronAPI as any).updateSettings(settingsToUpdate);
      return result;
    },
    {
      onSuccess: async () => {
        // Invalidate and refetch settings to update the UI
        queryClient.invalidateQueries(['settings']);
        
        // Refetch and wait for the data
        await queryClient.refetchQueries(['settings']);
        
        // Also manually refetch to ensure we get fresh data
        const freshSettings = await (window.electronAPI as any).getSettings();
        
        // Update local state with fresh data
        if (freshSettings) {
          setCompanyName(freshSettings.company_name || '');
          setContactDetails(freshSettings.company_contact_details || '');
          setCompanyAddress(freshSettings.company_address || '');
          setThankYouNote(freshSettings.thank_you_note || 'THANKS FOR DOING BUSINESS WITH US');
          setPrimaryLogoPath(freshSettings.primary_logo_path || '');
          setSecondaryLogoPath(freshSettings.secondary_logo_path || '');
          setSealPhotoPath(freshSettings.seal_photo_path || '');
        }
        
        setUploadMessage('Company details saved successfully!');
        setTimeout(() => setUploadMessage(''), 3000);
      },
      onError: (error: any) => {
        console.error('Save error:', error);
        setUploadMessage(`Save failed: ${error.message || 'Unknown error'}`);
      }
    }
  );

  const handleUploadLogo = async (logoType: 'primary' | 'secondary') => {
    setUploadingTarget(logoType);
    setUploadMessage('');
    
    try {
      // Select file
      const fileResult = await (window.electronAPI as any).selectLogoFile(logoType);
      
      if (fileResult.canceled) {
        return;
      }

      // Upload logo
      const result = await (window.electronAPI as any).uploadLogo(logoType, fileResult.filePath);

      if (result.success) {
        setUploadMessage(`${logoType === 'primary' ? 'Primary' : 'Secondary'} logo uploaded successfully!`);
        
        // Update the logo path
        if (logoType === 'primary') {
          setPrimaryLogoPath(result.filePath);
          // Reload base64
          const base64 = await (window.electronAPI as any).getPrimaryLogoBase64();
          setPrimaryLogoBase64(base64);
        } else {
          setSecondaryLogoPath(result.filePath);
          // Reload base64
          const base64 = await (window.electronAPI as any).getSecondaryLogoBase64();
          setSecondaryLogoBase64(base64);
        }
        
        // Update settings
        const currentSettings = await (window.electronAPI as any).getSettings();
        updateSettings({
          ...currentSettings,
          [logoType === 'primary' ? 'primary_logo_path' : 'secondary_logo_path']: result.filePath
        });
        
        setTimeout(() => setUploadMessage(''), 3000);
      } else {
        setUploadMessage(`Upload failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setUploadMessage(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleUploadSealPhoto = async () => {
    setUploadingTarget('seal');
    setUploadMessage('');
    
    try {
      // Select file
      const fileResult = await (window.electronAPI as any).selectSealPhotoFile();
      
      if (fileResult.canceled) {
        return;
      }

      // Upload seal photo
      const result = await (window.electronAPI as any).uploadSealPhoto(fileResult.filePath);

      if (result.success) {
        setUploadMessage('Seal photo uploaded successfully!');
        
        // Update the seal photo path
        setSealPhotoPath(result.filePath);
        // Reload base64
        const base64 = await (window.electronAPI as any).getSealPhotoBase64();
        setSealPhotoBase64(base64);
        
        // Invalidate settings cache to refresh
        queryClient.invalidateQueries(['settings']);
        
        setTimeout(() => setUploadMessage(''), 3000);
      } else {
        setUploadMessage(`Upload failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setUploadMessage(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleRemoveImage = async (imageType: 'primary' | 'secondary' | 'seal') => {
    try {
      const currentSettings = await (window.electronAPI as any).getSettings();
      const key = imageType === 'primary'
        ? 'primary_logo_path'
        : imageType === 'secondary'
          ? 'secondary_logo_path'
          : 'seal_photo_path';

      if (imageType === 'primary') {
        setPrimaryLogoPath('');
        setPrimaryLogoBase64('');
      } else if (imageType === 'secondary') {
        setSecondaryLogoPath('');
        setSecondaryLogoBase64('');
      } else {
        setSealPhotoPath('');
        setSealPhotoBase64('');
      }

      updateSettings({
        ...currentSettings,
        [key]: ''
      });

      setUploadMessage(`${imageType === 'seal' ? 'Seal photo' : `${imageType === 'primary' ? 'Primary' : 'Secondary'} logo`} removed successfully!`);
      setTimeout(() => setUploadMessage(''), 3000);
    } catch (error) {
      setUploadMessage(`Remove failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get current settings to preserve other fields
      const currentSettings = await (window.electronAPI as any).getSettings();
      
      // Update with new values (preserve empty strings)
      const settingsToSave = {
        ...currentSettings,
        company_name: companyName.trim(),
        company_contact_details: contactDetails.trim(),
        company_address: companyAddress.trim(),
        thank_you_note: (thankYouNote.trim() || 'THANKS FOR DOING BUSINESS WITH US')
      };
      
      // Save to database
      updateSettings(settingsToSave);
    } catch (error) {
      console.error('Error saving settings:', error);
      setUploadMessage(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="loading-state">Loading company details...</div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="form-group">
          <label className="form-label">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="form-input"
            placeholder="Enter company name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contact Details</label>
          <textarea
            value={contactDetails}
            onChange={(e) => setContactDetails(e.target.value)}
            className="form-textarea"
            rows={6}
            placeholder="Enter contact details (phone, email, etc.)&#10;Each line will be displayed as entered in the invoice."
          />
          <small className="form-hint">
            Enter all contact information here. Each line will be displayed exactly as entered in the invoice.
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Company Address</label>
          <textarea
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            className="form-textarea"
            rows={4}
            placeholder="Enter company address&#10;This will be displayed at the bottom of the invoice."
          />
          <small className="form-hint">
            Enter the company address. This will be displayed at the bottom of the invoice.
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Thank You Note</label>
          <input
            type="text"
            value={thankYouNote}
            onChange={(e) => setThankYouNote(e.target.value)}
            className="form-input"
            placeholder="Enter thank you message"
          />
          <small className="form-hint">
            This message will be displayed in the invoice (e.g., "THANKS FOR DOING BUSINESS WITH US").
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Primary Logo (for invoices)</label>
          <div className="logo-upload-section">
            {primaryLogoBase64 ? (
              <div className="logo-preview">
                <img src={primaryLogoBase64} alt="Primary Logo" className="logo-preview-img" />
                <p className="logo-info">Max file size: 800KB</p>
              </div>
            ) : (
              <div className="logo-placeholder">
                <p>No logo uploaded</p>
                <p className="logo-info">Max file size: 500KB</p>
              </div>
            )}
            <div className="logo-upload-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleUploadLogo('primary')}
                disabled={!!uploadingTarget}
              >
                {uploadingTarget === 'primary' ? 'Uploading...' : 'Upload Primary Logo'}
              </button>
              {primaryLogoBase64 && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleRemoveImage('primary')}
                  disabled={!!uploadingTarget}
                >
                  Remove Primary Logo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Secondary Logo (for page headers)</label>
          <div className="logo-upload-section">
            {secondaryLogoBase64 ? (
              <div className="logo-preview">
                <img src={secondaryLogoBase64} alt="Secondary Logo" className="logo-preview-img-small" />
                <p className="logo-info">Max file size: 500KB</p>
              </div>
            ) : (
              <div className="logo-placeholder">
                <p>No logo uploaded</p>
                <p className="logo-info">Max file size: 500KB</p>
              </div>
            )}
            <div className="logo-upload-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleUploadLogo('secondary')}
                disabled={!!uploadingTarget}
              >
                {uploadingTarget === 'secondary' ? 'Uploading...' : 'Upload Secondary Logo'}
              </button>
              {secondaryLogoBase64 && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleRemoveImage('secondary')}
                  disabled={!!uploadingTarget}
                >
                  Remove Secondary Logo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Seal Photo (for signature/seal position)</label>
          <div className="logo-upload-section">
            {sealPhotoBase64 ? (
              <div className="logo-preview">
                <img src={sealPhotoBase64} alt="Seal Photo" className="logo-preview-img-small" />
                <p className="logo-info">Max file size: 900KB (PNG, JPG, JPEG, SVG)</p>
              </div>
            ) : (
              <div className="logo-placeholder">
                <p>No seal photo uploaded</p>
                <p className="logo-info">Max file size: 900KB (PNG, JPG, JPEG, SVG)</p>
              </div>
            )}
            <div className="logo-upload-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleUploadSealPhoto}
                disabled={!!uploadingTarget}
              >
                {uploadingTarget === 'seal' ? 'Uploading...' : 'Upload Seal Photo'}
              </button>
              {sealPhotoBase64 && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleRemoveImage('seal')}
                  disabled={!!uploadingTarget}
                >
                  Remove Seal Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {uploadMessage && (
          <div className={`message ${uploadMessage.includes('failed') ? 'error' : 'success'}`}>
            {uploadMessage}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Company Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
