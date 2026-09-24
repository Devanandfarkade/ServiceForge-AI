/**
 * ServiceForge AI — Mock Transcription Service
 * Simulates Speech-to-Text conversion for voice inputs during frontend triage.
 * Designed as a clean abstraction easily replaceable by AWS Transcribe or Web Speech API.
 */

export const transcriptionService = {
  /**
   * Simulates transcribing recorded audio note into text
   * @param {Blob|null} audioBlob - Recorded audio blob (optional for mock)
   * @returns {Promise<{transcriptionId: string, transcript: string, confidence: number, language: string, durationSeconds: number, createdAt: string}>}
   */
  transcribeAudio: async (audioBlob = null) => {
    // Simulate short network & ML processing delay (1.2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1200));

    const mockTranscripts = [
      "The compressor starts normally but after around ten minutes it becomes very noisy and shuts down on thermal overload alert code E-402.",
      "Primary cooling loop temperature is spiking above 18 degrees Celsius with low suction pressure warning during peak facility hours.",
      "Backup diesel generator fail-to-start alarm triggered during weekly automated transfer switch self-test."
    ];

    // Pick first standard transcript for consistent demonstration
    const transcriptText = mockTranscripts[0];

    return {
      transcriptionId: `stt-${Math.floor(10000 + Math.random() * 90000)}`,
      transcript: transcriptText,
      confidence: 0.96,
      language: "en-US",
      durationSeconds: 14.5,
      createdAt: new Date().toISOString()
    };
  }
};
