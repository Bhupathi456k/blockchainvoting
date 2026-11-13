const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    category: { type: String, required: true, default: 'SYSTEM', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    performedBy: { type: String, required: true, default: 'SYSTEM' },
    targetType: { type: String, default: null },
    targetId: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      required: true,
      default: 'SUCCESS',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

auditLogSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

auditLogSchema.statics.findByPk = function (id) {
  if (!id) return null;
  return this.findById(id);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
