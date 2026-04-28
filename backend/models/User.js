import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    // GitHub OAuth identity — the primary key we use for upsert
    githubId: {
      type: String,
      required: true,
      unique: true, 
      index: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      default: '',
      trim: true,
    },

    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },

    avatarUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
)

export default mongoose.model('User', userSchema)
