/**
 * ServiceForge AI — Attachment Service & Validation Utility
 * Handles evidence file validation, preview Object URL creation, and attachment metadata modeling.
 */

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_ATTACHMENTS_COUNT = 10;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'text/csv'];

const PROHIBITED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.js', '.vbs', '.zip', '.tar', '.gz'];

export const attachmentService = {
  MAX_FILE_SIZE_BYTES,
  MAX_ATTACHMENTS_COUNT,

  /**
   * Format bytes to readable string (e.g., 2.4 MB, 450 KB)
   */
  formatFileSize: (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  },

  /**
   * Sanitizes filename to remove path traversal and risky shell characters
   */
  sanitizeFileName: (fileName) => {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  },

  /**
   * Validates a single file against size, MIME, and extension rules
   * @param {File} file 
   * @param {number} currentCount 
   * @returns {{ valid: boolean, error?: string, type?: 'image'|'document' }}
   */
  validateFile: (file, currentCount = 0) => {
    if (currentCount >= MAX_ATTACHMENTS_COUNT) {
      return { valid: false, error: `Maximum of ${MAX_ATTACHMENTS_COUNT} evidence attachments allowed per request.` };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `File "${file.name}" exceeds the maximum limit of 15 MB.` };
    }

    const ext = `.${file.name.split('.').pop().toLowerCase()}`;
    if (PROHIBITED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `File type "${ext}" is strictly prohibited for security.` };
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type) || ['.jpg', '.jpeg', '.png', '.webp', '.heic'].includes(ext);
    const isDoc = ALLOWED_DOCUMENT_TYPES.includes(file.type) || ['.pdf', '.txt', '.csv'].includes(ext);

    if (!isImage && !isDoc) {
      return { 
        valid: false, 
        error: `Unsupported format for "${file.name}". Allowed formats: JPEG, PNG, WEBP, HEIC, PDF, TXT, CSV.` 
      };
    }

    return { 
      valid: true, 
      type: isImage ? 'image' : 'document' 
    };
  },

  /**
   * Converts a valid File object into an Attachment state model
   * @param {File} file 
   * @param {'image'|'document'} type 
   * @returns {Object} Attachment object model
   */
  createAttachmentModel: (file, type) => {
    const id = `att-${Math.floor(100000 + Math.random() * 900000)}`;
    const previewUrl = type === 'image' ? URL.createObjectURL(file) : null;

    return {
      id,
      file,
      type,
      fileName: attachmentService.sanitizeFileName(file.name),
      contentType: file.type || (type === 'image' ? 'image/jpeg' : 'application/pdf'),
      sizeBytes: file.size,
      formattedSize: attachmentService.formatFileSize(file.size),
      previewUrl,
      status: 'ready',
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Clean up Object URLs to prevent memory leaks
   * @param {Object} attachment 
   */
  revokeAttachmentPreview: (attachment) => {
    if (attachment && attachment.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
  }
};
