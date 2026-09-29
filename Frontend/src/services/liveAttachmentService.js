/**
 * ServiceForge AI — Live Attachment Service (S3 via Presigned URLs)
 *
 * Handles evidence file uploads for service requests using S3 presigned URLs.
 * Workflow:
 *  1. Request a presigned PUT URL from the backend.
 *  2. Upload the file directly to S3 using the presigned URL.
 *  3. Return attachment metadata to include in the service request payload.
 *
 * Backend endpoint:
 *   POST /attachments/presign  → { presignedUrl, s3Key, expiresIn }
 *
 * This module reuses attachmentService for validation logic.
 */

import { apiClient } from '../lib/apiClient';
import { attachmentService } from './attachmentService';

export const liveAttachmentService = {
  ...attachmentService, // retain all validation, formatting, and model helpers

  /**
   * Upload a single attachment to S3 via a presigned URL.
   * @param {Object} attachmentModel - Created via attachmentService.createAttachmentModel()
   * @param {string} requestId - Parent service request ID (used as S3 prefix)
   * @returns {Promise<{ s3Key: string, fileName: string, contentType: string, sizeBytes: number }>}
   */
  uploadAttachment: async (attachmentModel, requestId) => {
    // Step 1: Request presigned URL from backend
    const presignData = await apiClient.post('/attachments/presign', {
      requestId,
      fileName: attachmentModel.fileName,
      contentType: attachmentModel.contentType,
      sizeBytes: attachmentModel.sizeBytes,
    });

    const { presignedUrl, s3Key } = presignData;

    // Step 2: Upload directly to S3
    await apiClient.uploadToS3(presignedUrl, attachmentModel.file, attachmentModel.contentType);

    // Step 3: Return metadata for the service request payload
    return {
      s3Key,
      fileName: attachmentModel.fileName,
      contentType: attachmentModel.contentType,
      sizeBytes: attachmentModel.sizeBytes,
      type: attachmentModel.type,
    };
  },

  /**
   * Upload multiple attachments sequentially.
   * Returns array of attachment metadata objects for the request payload.
   * @param {Object[]} attachmentModels
   * @param {string} requestId
   */
  uploadAll: async (attachmentModels, requestId) => {
    const results = [];
    for (const model of attachmentModels) {
      const result = await liveAttachmentService.uploadAttachment(model, requestId);
      results.push(result);
    }
    return results;
  },
};
