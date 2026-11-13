const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
    name: { type: String, required: true },
    party: { type: String, default: null },
    description: { type: String, default: null },
    imageUrl: { type: String, default: null },
    blockchainCandidateId: { type: Number, default: null, index: true },
    isDeployedToBlockchain: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

candidateSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

candidateSchema.statics.findByPk = function (id) {
  if (!id) return null;
  return this.findById(id);
};

const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports = Candidate;
