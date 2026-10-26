const mongoose = require('mongoose');

const { Schema } = mongoose;

const trainingApplicationSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Course',
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports =
  mongoose.models.TrainingApplication ||
  mongoose.model('TrainingApplication', trainingApplicationSchema);
