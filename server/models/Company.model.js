import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  country: { type: String, default: "India" },
  pincode: { type: String },
  phone: { type: String },
  email: { type: String },
  isHeadquarters: { type: Boolean, default: false },
});

const policySchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ["hr", "attendance", "leave", "code-of-conduct", "it", "finance", "other"],
    default: "hr",
  },
  content: { type: String, required: true },
  effectiveDate: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const orgNodeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String },
  reportsTo: { type: String },
  level: { type: Number, default: 1 },
});

const companySchema = new mongoose.Schema(
  {
    // Core identity
    name: { type: String, required: true, default: "NexHR" },
    legalName: { type: String },
    logo: { type: String },  // URL to logo image
    tagline: { type: String },
    description: { type: String },
    industry: {
      type: String,
      enum: [
        "Technology", "Finance", "Healthcare", "Education",
        "Manufacturing", "Retail", "Real Estate", "Media",
        "Hospitality", "Consulting", "Logistics", "Other",
      ],
      default: "Technology",
    },
    founded: { type: Number },
    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      default: "11-50",
    },

    // Contact
    email: { type: String },
    phone: { type: String },
    website: { type: String },

    // Address (HQ)
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String, default: "India" },
      pincode: { type: String },
    },

    // Social
    linkedin: { type: String },
    twitter: { type: String },
    instagram: { type: String },

    // Branches
    branches: [branchSchema],

    // Policies
    policies: [policySchema],

    // Org structure (simplified JSON tree)
    orgStructure: [orgNodeSchema],

    // Settings
    currency: { type: String, default: "INR" },
    timezone: { type: String, default: "Asia/Kolkata" },
    workingDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    workingHours: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "18:00" },
    },
    fiscalYearStart: { type: String, default: "April" },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);
export default Company;