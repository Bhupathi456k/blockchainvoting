const mongoose = require('mongoose');

const webAuthnCredentialSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    credentialId: { type: String, required: true, unique: true, index: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, required: true, default: 0 },
    transports: { type: mongoose.Schema.Types.Mixed, default: null },
    deviceName: { type: String, default: 'My device' },
    lastUsedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

webAuthnCredentialSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

webAuthnCredentialSchema.statics.findByPk = function (id) {
  if (!id) return null;
  return this.findById(id);
};

const WebAuthnCredential = mongoose.model('WebAuthnCredential', webAuthnCredentialSchema);
module.exports = WebAuthnCredential;
