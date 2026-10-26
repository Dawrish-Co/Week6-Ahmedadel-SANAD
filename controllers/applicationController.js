const mongoose = require('mongoose');
const { z } = require('zod');
const TrainingApplication = require('../models/Application');

const applicationBodySchema = z
  .object({
    courseId: z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid ObjectId'),
    applicantId: z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid ObjectId'),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

async function createApplication(req, res, next) {
  try {
    if (req.body.applicantId.toLowerCase() !== req.user.id.toLowerCase()) {
      return res.status(400).json({
        error: 'Applicant must match the authenticated user',
      });
    }

    const application = await TrainingApplication.create({
      ...req.body,
      courseId: new mongoose.Types.ObjectId(req.body.courseId),
      applicantId: new mongoose.Types.ObjectId(req.user.id),
      createdBy: new mongoose.Types.ObjectId(req.user.id),
      updatedBy: new mongoose.Types.ObjectId(req.user.id),
    });

    return res.status(201).json({ data: application });
  } catch (error) {
    return next(error);
  }
}

async function getApplications(req, res, next) {
  try {
    const applications = await TrainingApplication.find({
      applicantId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ data: applications });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  applicationBodySchema,
  createApplication,
  getApplications,
};
