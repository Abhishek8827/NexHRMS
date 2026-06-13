import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
// ✅ Sahi (LinkedIn/Linkedin ko remove kar diya)
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Plus,
  Edit,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  Users,
  Save,
  X,
  Link,
} from "lucide-react";
import {
  fetchCompany,
  updateCompany,
  addBranch,
  deleteBranch,
  addPolicy,
  deletePolicy,
  updateOrgStructure,
} from "../../features/company/companySlice";
import useAuth from "../../hooks/useAuth";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Spinner from "../../components/common/Spinner";

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Real Estate",
  "Media",
  "Hospitality",
  "Consulting",
  "Logistics",
  "Other",
];

const POLICY_CATEGORIES = [
  { value: "hr", label: "HR Policy" },
  { value: "attendance", label: "Attendance" },
  { value: "leave", label: "Leave Policy" },
  { value: "code-of-conduct", label: "Code of Conduct" },
  { value: "it", label: "IT Policy" },
  { value: "finance", label: "Finance" },
  { value: "other", label: "Other" },
];

const catColor = {
  hr: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  attendance:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  leave:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  "code-of-conduct":
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  it: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  finance:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

// ── Section wrapper ───────────────────────────────────────
const Section = ({ title, icon: Icon, children, action }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
          {title}
        </h3>
      </div>
      {action}
    </div>
    <div className="p-4 sm:p-6">{children}</div>
  </div>
);

const CompanyProfile = () => {
  const dispatch = useDispatch();
  const { isAdmin, isHR } = useAuth();
  const { profile, loading, saving } = useSelector((s) => s.company);
  const canEdit = isAdmin || isHR;

  const [editMode, setEditMode] = useState(false);
  const [branchModal, setBranchModal] = useState({ open: false });
  const [policyModal, setPolicyModal] = useState({ open: false });
  const [expandedPolicy, setExpandedPolicy] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const branchForm = useForm();
  const policyForm = useForm();

  useEffect(() => {
    dispatch(fetchCompany());
  }, [dispatch]);

  useEffect(() => {
    if (profile && editMode) {
      reset({
        name: profile.name,
        legalName: profile.legalName,
        tagline: profile.tagline,
        description: profile.description,
        industry: profile.industry,
        founded: profile.founded,
        size: profile.size,
        email: profile.email,
        phone: profile.phone,
        website: profile.website,
        linkedin: profile.linkedin,
        twitter: profile.twitter,
        "address.street": profile.address?.street,
        "address.city": profile.address?.city,
        "address.state": profile.address?.state,
        "address.country": profile.address?.country,
        "address.pincode": profile.address?.pincode,
      });
    }
  }, [profile, editMode, reset]);

  const onSaveCompany = async (data) => {
    const payload = {
      ...data,
      address: {
        street: data["address.street"],
        city: data["address.city"],
        state: data["address.state"],
        country: data["address.country"],
        pincode: data["address.pincode"],
      },
    };
    [
      "address.street",
      "address.city",
      "address.state",
      "address.country",
      "address.pincode",
    ].forEach((k) => delete payload[k]);

    const res = await dispatch(updateCompany(payload));
    if (!res.error) {
      toast.success("Company profile updated!");
      setEditMode(false);
    } else toast.error(res.payload || "Failed to update");
  };

  const onAddBranch = async (data) => {
    const res = await dispatch(addBranch(data));
    if (!res.error) {
      toast.success("Branch added!");
      setBranchModal({ open: false });
      branchForm.reset();
    } else toast.error(res.payload || "Failed");
  };

  const onDeleteBranch = async (id) => {
    if (!confirm("Delete this branch?")) return;
    const res = await dispatch(deleteBranch(id));
    if (!res.error) toast.success("Branch deleted");
    else toast.error(res.payload || "Failed");
  };

  const onAddPolicy = async (data) => {
    const res = await dispatch(addPolicy(data));
    if (!res.error) {
      toast.success("Policy added!");
      setPolicyModal({ open: false });
      policyForm.reset();
    } else toast.error(res.payload || "Failed");
  };

  const onDeletePolicy = async (id) => {
    if (!confirm("Delete this policy?")) return;
    const res = await dispatch(deletePolicy(id));
    if (!res.error) toast.success("Policy deleted");
    else toast.error(res.payload || "Failed");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Company Profile
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage company information and branding
          </p>
        </div>
        {canEdit && !editMode && (
          <Button onClick={() => setEditMode(true)} size="sm">
            <Edit className="w-4 h-4" /> Edit Profile
          </Button>
        )}
        {editMode && (
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit(onSaveCompany)}
              loading={saving}
              size="sm"
            >
              <Save className="w-4 h-4" /> Save Changes
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditMode(false)}
            >
              <X className="w-4 h-4" /> Cancel
            </Button>
          </div>
        )}
      </div>

      {/* ── Hero Banner ───────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Logo */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            {profile?.logo ? (
              <img
                src={profile.logo}
                alt="logo"
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-3xl font-bold text-white">
              {profile?.name || "NexHR"}
            </h2>
            {profile?.tagline && (
              <p className="text-indigo-200 text-sm sm:text-base mt-1">
                {profile.tagline}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-2">
              {profile?.industry && (
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">
                  {profile.industry}
                </span>
              )}
              {profile?.size && (
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">
                  {profile.size} employees
                </span>
              )}
              {profile?.founded && (
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">
                  Est. {profile.founded}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Form / View ─────────────────────────────── */}
      {editMode ? (
        <Section title="Edit Company Information" icon={Building2}>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                {...register("name", { required: true })}
                error={errors.name?.message}
              />
              <Input label="Legal Name" {...register("legalName")} />
              <Input label="Tagline" {...register("tagline")} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Industry
                </label>
                <select
                  {...register("industry")}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Founded Year"
                type="number"
                {...register("founded")}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Size
                </label>
                <select
                  {...register("size")}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {[
                    "1-10",
                    "11-50",
                    "51-200",
                    "201-500",
                    "501-1000",
                    "1000+",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Email" type="email" {...register("email")} />
              <Input label="Phone" {...register("phone")} />
              <Input label="Website" {...register("website")} />
              <Input label="LinkedIn URL" {...register("linkedin")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Brief company description..."
              />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Headquarters Address
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Street" {...register("address.street")} />
              <Input label="City" {...register("address.city")} />
              <Input label="State" {...register("address.state")} />
              <Input label="Country" {...register("address.country")} />
              <Input label="Pincode" {...register("address.pincode")} />
            </div>
          </form>
        </Section>
      ) : (
        /* ── View Mode ─────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* About */}
          <Section title="About" icon={Building2}>
            <div className="space-y-3">
              {profile?.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {profile.description}
                </p>
              )}
              {[
                ["Industry", profile?.industry],
                ["Company Size", profile?.size && `${profile.size} employees`],
                ["Founded", profile?.founded],
                ["Currency", profile?.currency],
                ["Timezone", profile?.timezone],
                [
                  "Fiscal Year",
                  profile?.fiscalYearStart &&
                    `Starts in ${profile.fiscalYearStart}`,
                ],
                ["Working Days", profile?.workingDays?.join(", ")],
                [
                  "Working Hours",
                  profile?.workingHours &&
                    `${profile.workingHours.start} – ${profile.workingHours.end}`,
                ],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {label}
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium text-right max-w-[200px] truncate">
                      {value}
                    </span>
                  </div>
                ))}
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contact Information" icon={Phone}>
            <div className="space-y-3">
              {[
                {
                  icon: Mail,
                  label: profile?.email,
                  href: `mailto:${profile?.email}`,
                },
                {
                  icon: Phone,
                  label: profile?.phone,
                  href: `tel:${profile?.phone}`,
                },
                {
                  icon: Globe,
                  label: profile?.website,
                  href: profile?.website,
                },
              ]
                .filter((c) => c.label)
                .map((c, i) => (
                  <a
                    key={i}
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <c.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{c.label}</span>
                  </a>
                ))}

              {profile?.address?.city && (
                <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    {[
                      profile.address.street,
                      profile.address.city,
                      profile.address.state,
                      profile.address.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    {profile.address.pincode && ` — ${profile.address.pincode}`}
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>
      )}

      {/* ── Branches ─────────────────────────────────────── */}
      <Section
        title="Branch Locations"
        icon={MapPin}
        action={
          canEdit && (
            <Button size="sm" onClick={() => setBranchModal({ open: true })}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Branch</span>
            </Button>
          )
        }
      >
        {!profile?.branches?.length ? (
          <div className="text-center py-8">
            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No branches added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.branches.map((b) => (
              <div
                key={b._id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {b.name}
                    </p>
                    {b.isHeadquarters && (
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                        Headquarters
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => onDeleteBranch(b._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    {[b.address, b.city, b.state, b.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
                {b.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="w-3.5 h-3.5" /> {b.phone}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Policies ─────────────────────────────────────── */}
      <Section
        title="Company Policies"
        icon={FileText}
        action={
          canEdit && (
            <Button size="sm" onClick={() => setPolicyModal({ open: true })}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Policy</span>
            </Button>
          )
        }
      >
        {!profile?.policies?.length ? (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No policies added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {profile.policies
              .filter((p) => p.isActive)
              .map((p) => (
                <div
                  key={p._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedPolicy(expandedPolicy === p._id ? null : p._id)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${catColor[p.category] || catColor.other}`}
                      >
                        {POLICY_CATEGORIES.find((c) => c.value === p.category)
                          ?.label || p.category}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {p.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePolicy(p._id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {expandedPolicy === p._id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedPolicy === p._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                            {p.content}
                          </p>
                          {p.effectiveDate && (
                            <p className="text-xs text-gray-400 mt-3">
                              Effective:{" "}
                              {new Date(p.effectiveDate).toLocaleDateString(
                                "en-IN",
                              )}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
          </div>
        )}
      </Section>

      {/* ── Org Structure ─────────────────────────────────── */}
      {profile?.orgStructure?.length > 0 && (
        <Section title="Organisation Structure" icon={Users}>
          <div className="space-y-2">
            {profile.orgStructure.map((node, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                style={{ paddingLeft: `${(node.level - 1) * 24 + 12}px` }}
              >
                <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {node.title}
                  </p>
                  {node.department && (
                    <p className="text-xs text-gray-500">{node.department}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Add Branch Modal ──────────────────────────────── */}
      <Modal
        isOpen={branchModal.open}
        onClose={() => setBranchModal({ open: false })}
        title="Add Branch"
        size="md"
      >
        <form
          onSubmit={branchForm.handleSubmit(onAddBranch)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Branch Name *"
              {...branchForm.register("name", { required: true })}
            />
            <Input
              label="City *"
              {...branchForm.register("city", { required: true })}
            />
          </div>
          <Input
            label="Address *"
            {...branchForm.register("address", { required: true })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="State" {...branchForm.register("state")} />
            <Input label="Country" {...branchForm.register("country")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Pincode" {...branchForm.register("pincode")} />
            <Input label="Phone" {...branchForm.register("phone")} />
          </div>
          <Input label="Email" type="email" {...branchForm.register("email")} />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              {...branchForm.register("isHeadquarters")}
              className="rounded"
            />
            Mark as Headquarters
          </label>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Add Branch
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setBranchModal({ open: false })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Add Policy Modal ──────────────────────────────── */}
      <Modal
        isOpen={policyModal.open}
        onClose={() => setPolicyModal({ open: false })}
        title="Add Policy"
        size="md"
      >
        <form
          onSubmit={policyForm.handleSubmit(onAddPolicy)}
          className="space-y-4"
        >
          <Input
            label="Policy Title *"
            {...policyForm.register("title", { required: true })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              {...policyForm.register("category")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {POLICY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Effective Date"
            type="date"
            {...policyForm.register("effectiveDate")}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content *
            </label>
            <textarea
              {...policyForm.register("content", {
                required: true,
                minLength: 20,
              })}
              rows={5}
              placeholder="Write the full policy content here..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Add Policy
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPolicyModal({ open: false })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CompanyProfile;
