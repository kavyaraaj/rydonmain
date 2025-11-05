import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import { AIDiagnosis } from '../src/controllers/aiController.js';
import { logger } from '../src/utils/logger.js';

dotenv.config();

const exportAIData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Fetch all AI diagnosis records with labels
    const diagnoses = await AIDiagnosis.find({
      label: { $in: ['resolvedByAI', 'escalated'] }
    }).select('-__v');

    if (diagnoses.length === 0) {
      logger.info('No labeled data found for export');
      return;
    }

    // Convert to JSONL format (one JSON object per line)
    const jsonlData = diagnoses.map(d => JSON.stringify({
      issueType: d.issueType,
      vehicleType: d.vehicleType,
      symptoms: d.symptoms,
      suggestions: d.suggestions,
      label: d.label,
      feedback: d.userFeedback,
      confidence: d.confidence
    })).join('\n');

    // Save to file
    const filename = `ai_training_data_${Date.now()}.jsonl`;
    fs.writeFileSync(filename, jsonlData);

    logger.info(`✅ Exported ${diagnoses.length} records to ${filename}`);

    // Also export as CSV
    const csvHeaders = 'issueType,vehicleType,symptoms,label,feedbackHelpful,feedbackRating\n';
    const csvRows = diagnoses.map(d => 
      `"${d.issueType}","${d.vehicleType}","${d.symptoms.replace(/"/g, '""')}","${d.label}","${d.userFeedback?.helpful}","${d.userFeedback?.rating}"`
    ).join('\n');
    
    const csvFilename = `ai_training_data_${Date.now()}.csv`;
    fs.writeFileSync(csvFilename, csvHeaders + csvRows);

    logger.info(`✅ Also exported to ${csvFilename}`);

    mongoose.connection.close();
  } catch (error) {
    logger.error('Export error:', error);
    process.exit(1);
  }
};

exportAIData();