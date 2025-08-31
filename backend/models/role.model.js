import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['admin', 'manager', 'member'],
      required: true,
      unique: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

const Role = mongoose.model('Role', roleSchema);
export default Role;
