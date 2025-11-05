import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// AI Diagnosis Collection Schema
const aiDiagnosisSchema = new mongoose.Schema({
  issueType: String,
  vehicleType: String,
  symptoms: String,
  attachments: [String],
  suggestions: [String],
  confidence: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  label: {
    type: String,
    enum: ['resolvedByAI', 'escalated', 'pending'],
    default: 'pending'
  },
  userFeedback: {
    helpful: Boolean,
    rating: Number,
    comments: String
  },
  createdAt: { type: Date, default: Date.now }
});

const AIDiagnosis = mongoose.model('AIDiagnosis', aiDiagnosisSchema);

// AI Diagnose Endpoint
export const diagnose = async (req, res) => {
  try {
    const { issueType, vehicleType, symptoms, attachments } = req.body;

    // Placeholder AI logic - integrate with OpenAI/TensorFlow model here
    const suggestions = generateSuggestions(issueType, vehicleType, symptoms);
    const confidence = 0.75; // Placeholder

    // Store for training
    const diagnosis = await AIDiagnosis.create({
      issueType,
      vehicleType,
      symptoms,
      attachments: attachments || [],
      suggestions,
      confidence,
      userId: req.user?._id
    });

    logger.info(`AI diagnosis created: ${diagnosis._id}`);

    res.json({
      diagnosisId: diagnosis._id,
      suggestions,
      confidence,
      disclaimer: 'This is an AI-generated suggestion. Please consult a professional for accurate diagnosis.'
    });
  } catch (error) {
    logger.error('AI diagnose error:', error);
    res.status(500).json({ error: 'Failed to generate diagnosis' });
  }
};

// Submit Feedback
export const submitFeedback = async (req, res) => {
  try {
    const { diagnosisId } = req.params;
    const { helpful, rating, comments, label } = req.body;

    const diagnosis = await AIDiagnosis.findById(diagnosisId);
    if (!diagnosis) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }

    diagnosis.userFeedback = { helpful, rating, comments };
    if (label) diagnosis.label = label;
    await diagnosis.save();

    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    logger.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

// Helper function - replace with actual AI model
function generateSuggestions(issueType, vehicleType, symptoms) {
  const suggestions = {
    'Battery': [
      'Check battery terminals for corrosion',
      'Test battery voltage (should be 12.6V for 12V battery)',
      'Check alternator output',
      'Inspect battery age (replace if >3 years old)'
    ],
    'Tire': [
      'Check tire pressure (refer to vehicle manual)',
      'Inspect tire tread depth (minimum 1.6mm)',
      'Look for punctures or cuts',
      'Check for uneven wear patterns'
    ],
    'Engine': [
      'Check engine oil level',
      'Inspect coolant level',
      'Listen for unusual noises',
      'Check for warning lights on dashboard'
    ]
  };

  return suggestions[issueType] || ['Unable to generate specific suggestions. Please contact a mechanic.'];
}

export { AIDiagnosis };