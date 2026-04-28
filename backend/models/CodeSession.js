
import mongoose from 'mongoose'
import { SUPPORTED_LANGUAGES } from '../config/constants.js'

const codeSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    language: {
      type: String,
      required: true,
      enum: SUPPORTED_LANGUAGES,   // only values from constants.js are valid
      default: 'javascript',
    },

    // the live code content — updated via PATCH /sessions/:id/code
    code: {
      type: String,
      default: '',
    },

    // the user who created this session
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // active collaborators — managed with $addToSet / $pull in socket logic
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('CodeSession', codeSessionSchema)
