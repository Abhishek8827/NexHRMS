import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Briefcase,
  Plus,
  Users,
  MapPin,
  Clock,
  ChevronRight,
  Edit,
} from "lucide-react";
import {
  fetchJobs,
  createJob,
  updateJob,
  fetchCandidates,
  updateCandidateStage,
  setSelectedJob,
} from "../../features/recruitment/recruitmentSlice";
import { fetchDepartments } from "../../features/employees/employeeSlice";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Spinner from "../../components/common/Spinner";
import Input from "../../components/common/Input";
import { formatDate } from "../../utils/helpers";

const JOB_TYPES = ["full-time", "part-time", "contract", "internship"];
const STAGES = [
  { id: "applied", label: "Applied", color: "bg-gray-100 text-gray-700" },
  { id: "screening", label: "Screening", color: "bg-blue-100 text-blue-700" },
  {
    id: "technical-round",
    label: "Technical",
    color: "bg-yellow-100 text-yellow-700",
  },
  { id: "hr-round", label: "HR Round", color: "bg-purple-100 text-purple-700" },
  {
    id: "final-round",
    label: "Final Round",
    color: "bg-orange-100 text-orange-700",
  },
  { id: "offer", label: "Offer", color: "bg-indigo-100 text-indigo-700" },
  { id: "hired", label: "Hired", color: "bg-green-100 text-green-700" },
  { id: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
];

const statusColor = {
  open: "green",
  closed: "red",
  draft: "gray",
  "on-hold": "yellow",
};

const Recruitment = () => {
  const dispatch = useDispatch();
  const { jobs, candidates, selectedJob, loading } = useSelector(
    (s) => s.recruitment,
  );
  const { departments } = useSelector((s) => s.employees);

  const [activeTab, setActiveTab] = useState("jobs");
  const [jobModal, setJobModal] = useState({ open: false, job: null });
  const [jobForm, setJobForm] = useState({
    title: "",
    department: "",
    location: "",
    jobType: "full-time",
    description: "",
    skills: "",
    openings: 1,
    status: "open",
    "experience.min": 0,
    "experience.max": 5,
    "salary.min": "",
    "salary.max": "",
  });

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleJobSubmit = async () => {
    if (!jobForm.title || !jobForm.description) {
      toast.error("Title and description are required");
      return;
    }

    const payload = {
      title: jobForm.title,
      department: jobForm.department || undefined,
      location: jobForm.location,
      jobType: jobForm.jobType,
      description: jobForm.description,
      skills: jobForm.skills
        ? jobForm.skills.split(",").map((s) => s.trim())
        : [],
      openings: Number(jobForm.openings),
      status: jobForm.status,
      experience: {
        min: Number(jobForm["experience.min"]),
        max: Number(jobForm["experience.max"]),
      },
      salary: {
        min: jobForm["salary.min"] ? Number(jobForm["salary.min"]) : undefined,
        max: jobForm["salary.max"] ? Number(jobForm["salary.max"]) : undefined,
        isDisclosed: !!(jobForm["salary.min"] && jobForm["salary.max"]),
      },
    };

    let res;
    if (jobModal.job) {
      res = await dispatch(updateJob({ id: jobModal.job._id, data: payload }));
    } else {
      res = await dispatch(createJob(payload));
    }

    if (!res.error) {
      toast.success(jobModal.job ? "Job updated!" : "Job posted successfully!");
      setJobModal({ open: false, job: null });
      resetForm();
    } else {
      toast.error(res.payload || "Failed");
    }
  };

  const resetForm = () => {
    setJobForm({
      title: "",
      department: "",
      location: "",
      jobType: "full-time",
      description: "",
      skills: "",
      openings: 1,
      status: "open",
      "experience.min": 0,
      "experience.max": 5,
      "salary.min": "",
      "salary.max": "",
    });
  };

  const openEditJob = (job) => {
    setJobForm({
      title: job.title || "",
      department: job.department?._id || "",
      location: job.location || "",
      jobType: job.jobType || "full-time",
      description: job.description || "",
      skills: job.skills?.join(", ") || "",
      openings: job.openings || 1,
      status: job.status || "open",
      "experience.min": job.experience?.min || 0,
      "experience.max": job.experience?.max || 5,
      "salary.min": job.salary?.min || "",
      "salary.max": job.salary?.max || "",
    });
    setJobModal({ open: true, job });
  };

  const handleViewCandidates = (job) => {
    dispatch(setSelectedJob(job));
    dispatch(fetchCandidates(job._id));
    setActiveTab("candidates");
  };

  const handleStageUpdate = async (candidateId, stage) => {
    const res = await dispatch(
      updateCandidateStage({ id: candidateId, stage }),
    );
    if (!res.error) toast.success("Stage updated");
    else toast.error(res.payload || "Failed");
  };

  const openCount = jobs.filter((j) => j.status === "open").length;
  const totalApplications = jobs.reduce(
    (s, j) => s + (j.applicationCount || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recruitment
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage job postings and hiring pipeline
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setJobModal({ open: true, job: null });
          }}
        >
          <Plus className="w-4 h-4" /> Post New Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Open Positions",
            value: openCount,
            color: "text-green-600 bg-green-50 dark:bg-green-900/20",
          },
          {
            label: "Total Postings",
            value: jobs.length,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "Applications",
            value: totalApplications,
            color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
          },
          {
            label: "Hired",
            value: candidates.filter((c) => c.stage === "hired").length,
            color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${s.color} rounded-xl p-4`}
          >
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: "jobs", label: `Job Postings (${jobs.length})` },
            {
              id: "candidates",
              label: `Pipeline${selectedJob ? ` — ${selectedJob.title}` : ""}`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-b-2 border-primary-600 text-primary-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No jobs posted yet</p>
                <Button
                  className="mt-4"
                  onClick={() => setJobModal({ open: true, job: null })}
                >
                  <Plus className="w-4 h-4" /> Post First Job
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {jobs.map((job, i) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {job.title}
                          </h3>
                          <Badge color={statusColor[job.status]}>
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {job.department?.name || "No department"}
                        </p>
                      </div>
                      <button
                        onClick={() => openEditJob(job)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{" "}
                        {job.location || "Remote"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {job.jobType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {job.experience?.min}–{job.experience?.max} yrs
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {job.openings} opening
                        {job.openings > 1 ? "s" : ""}
                      </span>
                    </div>

                    {job.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 4 && (
                          <span className="px-2 py-0.5 text-gray-400 text-xs">
                            +{job.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500">
                        Posted {formatDate(job.createdAt)}
                      </span>
                      <button
                        onClick={() => handleViewCandidates(job)}
                        className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        View Pipeline <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Candidates Pipeline Tab */}
        {activeTab === "candidates" && (
          <div className="p-6">
            {!selectedJob ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Select a job to view its pipeline
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setActiveTab("jobs")}
                >
                  Browse Jobs
                </Button>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No candidates yet for {selectedJob.title}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stage summary */}
                <div className="flex flex-wrap gap-2">
                  {STAGES.map((stage) => {
                    const count = candidates.filter(
                      (c) => c.stage === stage.id,
                    ).length;
                    return (
                      <span
                        key={stage.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${stage.color}`}
                      >
                        {stage.label}: {count}
                      </span>
                    );
                  })}
                </div>

                {/* Candidates Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50">
                        {[
                          "Candidate",
                          "Contact",
                          "Source",
                          "Stage",
                          "Applied",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {candidates.map((c, i) => (
                        <motion.tr
                          key={c._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {c.name}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {c.email}
                            </p>
                            {c.phone && (
                              <p className="text-xs text-gray-500">{c.phone}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs text-gray-500 capitalize">
                              {c.source?.replace(/-/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={c.stage}
                              onChange={(e) =>
                                handleStageUpdate(c._id, e.target.value)
                              }
                              className="text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              {STAGES.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-500">
                            {formatDate(c.createdAt)}
                          </td>
                          <td className="px-4 py-4">
                            {c.resumeUrl && (
                              <a
                                href={c.resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                              >
                                Resume ↗
                              </a>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Job Form Modal */}
      <Modal
        isOpen={jobModal.open}
        onClose={() => {
          setJobModal({ open: false, job: null });
          resetForm();
        }}
        title={jobModal.job ? "Edit Job Posting" : "Post New Job"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Job Title"
              required
              placeholder="e.g. Senior React Developer"
              value={jobForm.title}
              onChange={(e) =>
                setJobForm((f) => ({ ...f, title: e.target.value }))
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <select
                value={jobForm.department}
                onChange={(e) =>
                  setJobForm((f) => ({ ...f, department: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Location"
              placeholder="e.g. Mumbai / Remote"
              value={jobForm.location}
              onChange={(e) =>
                setJobForm((f) => ({ ...f, location: e.target.value }))
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Type
              </label>
              <select
                value={jobForm.jobType}
                onChange={(e) =>
                  setJobForm((f) => ({ ...f, jobType: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Min Experience (years)"
              type="number"
              value={jobForm["experience.min"]}
              onChange={(e) =>
                setJobForm((f) => ({ ...f, "experience.min": e.target.value }))
              }
            />
            <Input
              label="Max Experience (years)"
              type="number"
              value={jobForm["experience.max"]}
              onChange={(e) =>
                setJobForm((f) => ({ ...f, "experience.max": e.target.value }))
              }
            />
            <Input
              label="Min Salary (₹)"
              type="number"
              placeholder="e.g. 500000"
              value={jobForm["salary.min"]}
              onChange={(e) =>
                setJobForm((f) => ({ ...f, "salary.min": e.target.value }))
              }
            />
            <Input
              label="Max Salary (₹)"
              type="number"
              placeholder="e.g. 900000"
              value={jobForm["salary.max"]}
              onChange={(e) =>
                setJobForm((f) => ({ ...f, "salary.max": e.target.value }))
              }
            />
            <Input
              label="Number of Openings"
              type="number"
              value={jobForm.openings}
              onChange={(e) =>
                setJobForm((f) => ({ ...f, openings: e.target.value }))
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={jobForm.status}
                onChange={(e) =>
                  setJobForm((f) => ({ ...f, status: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="open">Open</option>
                <option value="draft">Draft</option>
                <option value="on-hold">On Hold</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <Input
            label="Required Skills (comma separated)"
            placeholder="React, Node.js, MongoDB"
            value={jobForm.skills}
            onChange={(e) =>
              setJobForm((f) => ({ ...f, skills: e.target.value }))
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={jobForm.description}
              onChange={(e) =>
                setJobForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Describe the role, responsibilities and requirements..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleJobSubmit}>
              {jobModal.job ? "Update Job" : "Post Job"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setJobModal({ open: false, job: null });
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Recruitment;
