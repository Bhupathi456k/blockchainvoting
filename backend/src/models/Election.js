const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema(
  {
    hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true },
    description: { type: String, default: null },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['DRAFT', 'UPCOMING', 'ACTIVE', 'ENDED', 'CANCELLED'],
      default: 'UPCOMING',
      required: true,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE'],
      default: 'PUBLIC',
      required: true,
      index: true,
    },
    contractElectionId: { type: Number, default: null },
    type: { type: String, default: null, index: true },
    organization: { type: String, default: null },
    category: { type: String, default: null, index: true },
    isDeployedToBlockchain: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

electionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

electionSchema.statics.findByPk = function (id) {
  if (!id) return null;
  return this.findById(id);
};

const Election = mongoose.model('Election', electionSchema);
module.exports = Election;
