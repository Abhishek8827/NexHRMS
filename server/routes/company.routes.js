import { Router } from "express";
import {
  getCompany, updateCompany, uploadLogo,
  addBranch, updateBranch, deleteBranch,
  addPolicy, updatePolicy, deletePolicy,
  updateOrgStructure,
} from "../controllers/company.controller.js";
// import { verifyJWT, authorize } from "../middleware/auth.middleware.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require login
// router.use(verifyJWT);
router.use(protect);

// ── Public to all roles ────────────────────────────────────
router.get("/", getCompany);

// ── Admin + HR only ────────────────────────────────────────
router.put("/", authorize("admin", "hr"), updateCompany);
router.post("/logo", authorize("admin"), uploadLogo);

// Branches
router.post("/branches", authorize("admin", "hr"), addBranch);
router.put("/branches/:branchId", authorize("admin", "hr"), updateBranch);
router.delete("/branches/:branchId", authorize("admin"), deleteBranch);

// Policies
router.post("/policies", authorize("admin", "hr"), addPolicy);
router.put("/policies/:policyId", authorize("admin", "hr"), updatePolicy);
router.delete("/policies/:policyId", authorize("admin"), deletePolicy);

// Org structure
router.put("/org-structure", authorize("admin", "hr"), updateOrgStructure);

export default router;