const mongoose = require('mongoose');

const electionHostRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    electionTitle: { type: String, required: true },
    electionDescription: { type: String, default: null },
    purpose: { type: String, required: true },
    expectedVoters: { type: Number, required: true, min: 1 },
    proposedStartDate: { type: Date, required: true },
    proposedEndDate: { type: Date, required: true },
    electionType: { type: String, default: null },
    additionalInformation: { type: String, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    adminReason: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

electionHostRequestSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

electionHostRequestSchema.statics.findByPk = function (id) {
  if (!id) return null;
  return this.findById(id);
};

const ElectionHostRequest = mongoose.model('ElectionHostRequest', electionHostRequestSchema);
module.exports = ElectionHostRequest;
