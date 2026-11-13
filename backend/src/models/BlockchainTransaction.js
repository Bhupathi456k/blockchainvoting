const mongoose = require('mongoose');

const blockchainTransactionSchema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    transactionHash: { type: String, required: true, unique: true, index: true },
    blockNumber: { type: Number, default: null },
    transactionType: {
      type: String,
      enum: ['VOTE', 'ELECTION_CREATE', 'CANDIDATE_ADD', 'VOTER_AUTHORIZE', 'ELECTION_START', 'ELECTION_END'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'FAILED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    gasUsed: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

blockchainTransactionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

blockchainTransactionSchema.statics.findByPk = function (id) {
  if (!id) return null;
  return this.findById(id);
};

const BlockchainTransaction = mongoose.model('BlockchainTransaction', blockchainTransactionSchema);
module.exports = BlockchainTransaction;
