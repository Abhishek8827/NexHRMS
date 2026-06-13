import Company from "../models/Company.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ── Get company profile (public to all logged-in users) ───
export const getCompany = asyncHandler(async (req, res) => {
  let company = await Company.findOne();
  if (!company) {
    company = await Company.create({ name: "NexHR", industry: "Technology" });
  }
  return res.status(200).json(new ApiResponse(200, company, "Company fetched"));
});

// ── Update core company info (admin only) ─────────────────
export const updateCompany = asyncHandler(async (req, res) => {
  const allowed = [
    "name", "legalName", "tagline", "description", "industry",
    "founded", "size", "email", "phone", "website",
    "address", "linkedin", "twitter", "instagram",
    "currency", "timezone", "workingDays", "workingHours", "fiscalYearStart",
  ];

  const updateData = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  let company = await Company.findOne();
  if (!company) {
    company = await Company.create(updateData);
  } else {
    Object.assign(company, updateData);
    await company.save();
  }

  return res.status(200).json(new ApiResponse(200, company, "Company updated"));
});

// ── Upload logo (admin only) ──────────────────────────────
export const uploadLogo = asyncHandler(async (req, res) => {
  const { logoUrl } = req.body;
  if (!logoUrl) throw new ApiError(400, "Logo URL is required");

  let company = await Company.findOne();
  if (!company) company = await Company.create({ name: "NexHR" });

  company.logo = logoUrl;
  await company.save();

  return res.status(200).json(new ApiResponse(200, { logo: company.logo }, "Logo updated"));
});

// ── Branches ──────────────────────────────────────────────
export const addBranch = asyncHandler(async (req, res) => {
  const { name, address, city, state, country, pincode, phone, email, isHeadquarters } = req.body;
  if (!name || !address || !city) throw new ApiError(400, "Name, address and city required");

  const company = await Company.findOne();
  if (!company) throw new ApiError(404, "Company profile not found");

  // Only one HQ allowed
  if (isHeadquarters) {
    company.branches.forEach((b) => { b.isHeadquarters = false; });
  }

  company.branches.push({ name, address, city, state, country, pincode, phone, email, isHeadquarters });
  await company.save();

  return res.status(201).json(new ApiResponse(201, company.branches, "Branch added"));
});

export const updateBranch = asyncHandler(async (req, res) => {
  const company = await Company.findOne();
  if (!company) throw new ApiError(404, "Company not found");

  const branch = company.branches.id(req.params.branchId);
  if (!branch) throw new ApiError(404, "Branch not found");

  const fields = ["name", "address", "city", "state", "country", "pincode", "phone", "email", "isHeadquarters"];
  fields.forEach((f) => { if (req.body[f] !== undefined) branch[f] = req.body[f]; });

  await company.save();
  return res.status(200).json(new ApiResponse(200, company.branches, "Branch updated"));
});

export const deleteBranch = asyncHandler(async (req, res) => {
  const company = await Company.findOne();
  if (!company) throw new ApiError(404, "Company not found");

  company.branches = company.branches.filter(
    (b) => b._id.toString() !== req.params.branchId
  );
  await company.save();
  return res.status(200).json(new ApiResponse(200, company.branches, "Branch deleted"));
});

// ── Policies ──────────────────────────────────────────────
export const addPolicy = asyncHandler(async (req, res) => {
  const { title, category, content, effectiveDate } = req.body;
  if (!title || !content) throw new ApiError(400, "Title and content required");

  const company = await Company.findOne();
  if (!company) throw new ApiError(404, "Company not found");

  company.policies.push({ title, category, content, effectiveDate, isActive: true });
  await company.save();

  return res.status(201).json(new ApiResponse(201, company.policies, "Policy added"));
});

export const updatePolicy = asyncHandler(async (req, res) => {
  const company = await Company.findOne();
  if (!company) throw new ApiError(404, "Company not found");

  const policy = company.policies.id(req.params.policyId);
  if (!policy) throw new ApiError(404, "Policy not found");

  const fields = ["title", "category", "content", "effectiveDate", "isActive"];
  fields.forEach((f) => { if (req.body[f] !== undefined) policy[f] = req.body[f]; });

  await company.save();
  return res.status(200).json(new ApiResponse(200, company.policies, "Policy updated"));
});

export const deletePolicy = asyncHandler(async (req, res) => {
  const company = await Company.findOne();
  if (!company) throw new ApiError(404, "Company not found");

  company.policies = company.policies.filter(
    (p) => p._id.toString() !== req.params.policyId
  );
  await company.save();
  return res.status(200).json(new ApiResponse(200, company.policies, "Policy deleted"));
});

// ── Org structure ─────────────────────────────────────────
export const updateOrgStructure = asyncHandler(async (req, res) => {
  const { orgStructure } = req.body;
  if (!Array.isArray(orgStructure)) throw new ApiError(400, "orgStructure must be array");

  const company = await Company.findOne();
  if (!company) throw new ApiError(404, "Company not found");

  company.orgStructure = orgStructure;
  await company.save();

  return res.status(200).json(new ApiResponse(200, company.orgStructure, "Org structure updated"));
});