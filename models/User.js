const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  email: { type: String, default: '' },
  category: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  functionUnit: { type: String, default: '' },
  functionUnitOthers: { type: String, default: '' },
  businessUnit: { type: String, default: '' },
  globalId: { type: String, default: '' },
  title: { type: String, default: '' },
  fullName: { type: String, default: '' },
  salutation: { type: String, default: '' },
  surname: { type: String, default: '' },
  givenName: { type: String, default: '' },
  nameOnBadge: { type: String, default: '' },
  gender: { type: String, default: '' },
  officeTel: {
    countryCode: String,
    areaCode: String,
    number: String,
  },
  mobile: {
    countryCode: String,
    areaCode: String,
    number: String,
  },
  specialPhysicalCondition: { type: String, default: '' },
  specialPhysicalConditionDetail: { type: String, default: '' },
  dietaryRequirements: [{ type: String }],
  otherDietaryRequirements: { type: String, default: '' },
  galaMainCourse: { type: String, default: '' },
  shirtSize: { type: String, default: '' },
  photoConsent: { type: Boolean, default: false },
  socialEventPolicyConsent: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
