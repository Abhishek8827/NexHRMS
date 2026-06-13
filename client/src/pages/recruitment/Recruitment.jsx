import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Briefcase,
  Plus,
  Users,
  Eye,
  ChevronDown,
  MapPin,
  Clock,
  X,
  Check,
} from "lucide-react";
import {
  fetchJobs,
  createJob,
  updateJob,
  fetchCandidates,
  updateCandidateStage,
} from "../../features/recruitment/recruitmentSlice";
import useAuth from "../../hooks/useAuth";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Badge from "../../components/common/Badge";
import Spinner from "../../components/common/Spinner";
import { formatDate } from "../../utils/helpers";
import { useForm } from "react-hook-form";

const JOB_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "remote",
];
const STAGES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
];

const stageColor = {
  applied: "gray",
  screening: "blue",
  interview: "yellow",
  offer: "purple",
  hired: "green",
  rejected: "red",
};

const JobCard = ({ job, onView, onToggle, canManage }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
            {job.title}
          </h3>
          <Badge color={job.status === "open" ? "green" : "gray"}>
            {job.status}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 mt-1">
          {job.department && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> {job.department}
            </span>
          )}
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {job.jobType?.replace(/-/g, " ")}
          </span>
          {job.deadline && <span>Closes: {formatDate(job.deadline)}</span>}
        </div>
        {job.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
            {job.description}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
          <Users className="w-3 h-3" />
          <span>{job.candidateCount ?? 0}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 mt-3 sm:mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex-wrap">
      <button
        onClick={() => onView(job)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
      >
        <Eye className="w-3.5 h-3.5" /> View Candidates
      </button>
      {canManage && (
        <button
          onClick={() => onToggle(job)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            job.status === "open"
              ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          }`}
        >
          {job.status === "open" ? (
            <>
              <X className="w-3.5 h-3.5" /> Close Job
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" /> Reopen
            </>
          )}
        </button>
      )}
    </div>
  </motion.div>
);

const Recruitment = () => {
  const dispatch = useDispatch();
  const { isAdminOrHR } = useAuth();
  const { jobs, candidates, loading } = useSelector((s) => s.recruitment);

  const [tab, setTab] = useState("jobs");
  const [createModal, setCreateModal] = useState(false);
  const [candidateModal, setCandidateModal] = useState({
    open: false,
    job: null,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { jobType: "full-time", vacancies: 1 },
  });

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  const onCreateJob = async (data) => {
    const res = await dispatch(createJob(data));
    if (!res.error) {
      toast.success("Job posted!");
      setCreateModal(false);
      reset();
    } else toast.error(res.payload || "Failed to post job");
  };

  const handleToggleJob = async (job) => {
    const newStatus = job.status === "open" ? "closed" : "open";
    const res = await dispatch(updateJob({ id: job._id, status: newStatus }));
    if (!res.error)
      toast.success(`Job ${newStatus === "open" ? "reopened" : "closed"}`);
    else toast.error(res.payload || "Failed");
  };

  const handleViewCandidates = (job) => {
    dispatch(fetchCandidates(job._id));
    setCandidateModal({ open: true, job });
  };

  const handleStageUpdate = async (candidateId, stage) => {
    const res = await dispatch(
      updateCandidateStage({
        jobId: candidateModal.job._id,
        candidateId,
        stage,
      }),
    );
    if (!res.error) toast.success("Stage updated");
    else toast.error(res.payload || "Failed");
  };

  const openJobs = jobs.filter((j) => j.status === "open").length;
  const closedJobs = jobs.filter((j) => j.status === "closed").length;
  const totalCandidates = jobs.reduce((s, j) => s + (j.candidateCount ?? 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Recruitment
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage job postings and candidates
          </p>
        </div>
        {isAdminOrHR && (
          <Button onClick={() => setCreateModal(true)} size="sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post Job</span>
            <span className="sm:hidden">Post</span>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: "Open Roles",
            value: openJobs,
            color:
              "text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
          },
          {
            label: "Closed",
            value: closedJobs,
            color:
              "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400",
          },
          {
            label: "Total Candidates",
            value: totalCandidates,
            color:
              "text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 sm:p-4`}>
            <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
            <p className="text-[10px] sm:text-xs font-medium mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
        {["jobs", "pipeline"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : tab === "jobs" ? (
        /* Jobs Grid */
        jobs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No job postings yet</p>
            {isAdminOrHR && (
              <Button
                className="mt-4"
                onClick={() => setCreateModal(true)}
                size="sm"
              >
                <Plus className="w-4 h-4" /> Post First Job
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onView={handleViewCandidates}
                onToggle={handleToggleJob}
                canManage={isAdminOrHR}
              />
            ))}
          </div>
        )
      ) : (
        /* Pipeline view — all candidates across jobs */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="flex gap-3 p-4 min-w-max">
              {STAGES.map((stage) => {
                const stageCandidates = candidates.filter(
                  (c) => c.stage === stage,
                );
                return (
                  <div key={stage} className="w-56 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide capitalize">
                        {stage}
                      </span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">
                        {stageCandidates.length}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 min-h-[100px] space-y-2">
                      {stageCandidates.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">
                          Empty
                        </p>
                      ) : (
                        stageCandidates.map((c) => (
                          <div
                            key={c._id}
                            className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-xs"
                          >
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {c.name}
                            </p>
                            <p className="text-gray-500 truncate">{c.email}</p>
                            {c.jobTitle && (
                              <p className="text-primary-600 mt-0.5">
                                {c.jobTitle}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {candidates.length === 0 && (
            <div className="text-center py-10 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                No candidates yet. Click "View Candidates" on a job to load
                them.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Post Job Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => {
          setCreateModal(false);
          reset();
        }}
        title="Post New Job"
        size="md"
      >
        <form onSubmit={handleSubmit(onCreateJob)} className="space-y-4">
          <Input
            label="Job Title *"
            placeholder="e.g. Senior React Developer"
            error={errors.title?.message}
            {...register("title", { required: "Title is required" })}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Type
              </label>
              <select
                {...register("jobType")}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/-/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Vacancies"
              type="number"
              {...register("vacancies", { min: 1 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department"
              placeholder="e.g. Engineering"
              {...register("department")}
            />
            <Input
              label="Location"
              placeholder="e.g. Remote / Mumbai"
              {...register("location")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Salary Range"
              placeholder="e.g. ₹8-12 LPA"
              {...register("salaryRange")}
            />
            <Input
              label="Application Deadline"
              type="date"
              {...register("deadline")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Describe the role, responsibilities..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Requirements
            </label>
            <textarea
              {...register("requirements")}
              rows={2}
              placeholder="Skills, experience, qualifications..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Post Job
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCreateModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Candidates Modal */}
      <Modal
        isOpen={candidateModal.open}
        onClose={() => setCandidateModal({ open: false, job: null })}
        title={`Candidates — ${candidateModal.job?.title || ""}`}
        size="lg"
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No candidates for this job yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((c) => (
              <div
                key={c._id}
                className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex-wrap"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                  {c.phone && (
                    <p className="text-xs text-gray-400">{c.phone}</p>
                  )}
                  {c.appliedAt && (
                    <p className="text-xs text-gray-400">
                      Applied: {formatDate(c.appliedAt)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge color={stageColor[c.stage] || "gray"}>{c.stage}</Badge>
                  {isAdminOrHR && (
                    <select
                      value={c.stage}
                      onChange={(e) => handleStageUpdate(c._id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Recruitment;
