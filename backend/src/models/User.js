const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    voterId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    phone: { type: String, default: null },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['VOTER', 'ADMIN'], default: 'VOTER', required: true },
    hostPermissionStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE',
      required: true,
    },
    walletAddress: { type: String, default: null, index: true },
    isEligible: { type: Boolean, default: true },
    hasVoted: { type: Boolean, default: false },
    faceData: { type: String, default: null },
    isFaceVerified: { type: Boolean, default: false },
    fingerprintData: { type: String, default: null },
    isFingerprintVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

userSchema.statics.findByPk = function (id) {
  if (!id) return null;
  return this.findById(id);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
