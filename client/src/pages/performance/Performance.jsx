import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Star,
  TrendingUp,
  Plus,
  Award,
  ChevronDown,
  ChevronUp,
  Check,
  User,
  Target,
  BarChart2,
  MessageSquare,
} from "lucide-react";
import {
  fetchMyReviews,
  fetchAllReviews,
  createReview,
  submitSelfReview,
  submitManagerReview,
} from "../../features/performance/performanceSlice";
import { fetchEmployees } from "../../features/employees/employeeSlice";
import useAuth from "../../hooks/useAuth";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Spinner from "../../components/common/Spinner";
import Input from "../../components/common/Input";
import { formatDate, getInitials } from "../../utils/helpers";

const QUARTERS = [1, 2, 3, 4];

const GRADES = [
  {
    value: "excellent",
    label: "Excellent",
    color:
      "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    value: "good",
    label: "Good",
    color: "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    value: "average",
    label: "Average",
    color:
      "text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    value: "needs-improvement",
    label: "Needs Improvement",
    color:
      "text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    value: "unsatisfactory",
    label: "Unsatisfactory",
    color: "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  },
];

const STATUS_COLOR = {
  draft: "gray",
  "self-review": "blue",
  "manager-review": "yellow",
  acknowledged: "green",
  completed: "green",
};

// ── Star Rating ───────────────────────────────────────────
const StarRating = ({ value, onChange, readonly = false, size = "md" }) => {
  const [hover, setHover] = useState(0);
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={`star-${star}`}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          } transition-transform`}
        >
          <Star
            className={`${sizes[size]} transition-colors ${
              star <= (hover || value || 0)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-1">
          {value}.0
        </span>
      )}
    </div>
  );
};

// ── Review Card ───────────────────────────────────────────
const ReviewCard = ({ review, onAction, canManage, currentUserId }) => {
  const [expanded, setExpanded] = useState(false);
  const grade = GRADES.find((g) => g.value === review.grade);
  const isMyReview = review.employee?._id === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          {canManage && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {getInitials(
                review.employee?.firstName,
                review.employee?.lastName,
              )}
            </div>
          )}
          <div>
            {canManage && (
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {review.employee?.firstName} {review.employee?.lastName}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Q{review.quarter} {review.year} Performance Review
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge color={STATUS_COLOR[review.status]}>
                {review.status.replace(/-/g, " ")}
              </Badge>
              {grade && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${grade.color}`}
                >
                  {grade.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {review.overallScore != null && (
            <div className="text-right hidden sm:block">
              <p className="text-2xl font-bold text-primary-600">
                {review.overallScore}
              </p>
              <p className="text-xs text-gray-500">/ 5.0</p>
            </div>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-5 space-y-6 bg-gray-50 dark:bg-gray-800/30">
              {/* Goals */}
              {review.goals?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary-600" /> Goals
                  </h4>
                  <div className="space-y-3">
                    {review.goals.map((goal, i) => (
                      // KEY FIX: composite key using review._id + index
                      <div
                        key={`goal-${review._id}-${i}`}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {goal.title}
                          </p>
                          {goal.score != null && (
                            <StarRating value={goal.score} readonly size="sm" />
                          )}
                        </div>
                        {goal.target && (
                          <p className="text-xs text-gray-500 mt-1">
                            Target: {goal.target}
                          </p>
                        )}
                        {goal.achieved && (
                          <p className="text-xs text-green-600 mt-1">
                            Achieved: {goal.achieved}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competencies */}
              {review.competencies?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-primary-600" />
                    Competencies
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {review.competencies.map((comp, i) => (
                      // KEY FIX: composite key
                      <div
                        key={`comp-${review._id}-${i}`}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {comp.name}
                          </p>
                          {comp.score != null && (
                            <StarRating value={comp.score} readonly size="sm" />
                          )}
                        </div>
                        {comp.comments && (
                          <p className="text-xs text-gray-500">
                            {comp.comments}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ratings Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {review.selfRating != null && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Self Rating
                    </p>
                    <StarRating value={review.selfRating} readonly />
                    {review.selfComments && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {review.selfComments}
                      </p>
                    )}
                  </div>
                )}
                {review.managerRating != null && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Manager Rating
                    </p>
                    <StarRating value={review.managerRating} readonly />
                    {review.managerComments && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {review.managerComments}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Next Period Goals */}
              {review.nextPeriodGoals?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Goals for Next Period
                  </p>
                  <ul className="space-y-1">
                    {review.nextPeriodGoals.map((g, i) => (
                      <li
                        key={`next-goal-${review._id}-${i}`}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-primary-600 mt-0.5">→</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {/* Employee self review button */}
                {isMyReview && review.status === "draft" && (
                  <Button
                    size="sm"
                    onClick={() => onAction("self-review", review)}
                  >
                    <Star className="w-4 h-4" /> Submit Self Review
                  </Button>
                )}
                {/* Manager review button */}
                {canManage && review.status === "manager-review" && (
                  <Button
                    size="sm"
                    onClick={() => onAction("manager-review", review)}
                  >
                    <Check className="w-4 h-4" /> Submit Manager Review
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Self Review Modal ─────────────────────────────────────
const SelfReviewModal = ({ review, onClose, onSubmit }) => {
  const [selfRating, setSelfRating] = useState(review?.selfRating || 0);
  const [selfComments, setSelfComments] = useState(review?.selfComments || "");
  const [goals, setGoals] = useState(
    review?.goals || [
      { title: "Goal 1", target: "", achieved: "", score: 0 },
      { title: "Goal 2", target: "", achieved: "", score: 0 },
    ],
  );
  const [submitting, setSubmitting] = useState(false);

  const updateGoal = (idx, field, value) => {
    const updated = [...goals];
    updated[idx] = { ...updated[idx], [field]: value };
    setGoals(updated);
  };

  const handleSubmit = async () => {
    if (!selfRating) {
      toast.error("Please provide a self rating");
      return;
    }
    if (!selfComments.trim()) {
      toast.error("Please add self comments");
      return;
    }
    setSubmitting(true);
    await onSubmit({ selfRating, selfComments, goals });
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {/* Goals */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Rate Your Goals
        </h4>
        <div className="space-y-3">
          {goals.map((goal, i) => (
            <div
              key={`self-goal-${i}`}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            >
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {goal.title}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    What was the target?
                  </label>
                  <input
                    value={goal.target || ""}
                    onChange={(e) => updateGoal(i, "target", e.target.value)}
                    placeholder="Describe the target..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    What did you achieve?
                  </label>
                  <input
                    value={goal.achieved || ""}
                    onChange={(e) => updateGoal(i, "achieved", e.target.value)}
                    placeholder="Describe achievement..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Rate this goal
                </label>
                <StarRating
                  value={goal.score || 0}
                  onChange={(v) => updateGoal(i, "score", v)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Self Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Overall Self Rating <span className="text-red-500">*</span>
        </label>
        <StarRating value={selfRating} onChange={setSelfRating} size="lg" />
      </div>

      {/* Comments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Comments <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          value={selfComments}
          onChange={(e) => setSelfComments(e.target.value)}
          placeholder="Describe your key achievements, challenges, and learning..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={handleSubmit} loading={submitting}>
          Submit Self Review
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

// ── Manager Review Modal ──────────────────────────────────
const ManagerReviewModal = ({ review, onClose, onSubmit }) => {
  const [managerRating, setManagerRating] = useState(
    review?.managerRating || 0,
  );
  const [managerComments, setManagerComments] = useState(
    review?.managerComments || "",
  );
  const [grade, setGrade] = useState(review?.grade || "");
  const [overallScore, setOverallScore] = useState(review?.overallScore || 0);
  const [nextGoals, setNextGoals] = useState(
    review?.nextPeriodGoals?.join("\n") || "",
  );
  const [competencies, setCompetencies] = useState(
    review?.competencies?.length > 0
      ? review.competencies
      : [
          { name: "Communication", score: 0, comments: "" },
          { name: "Teamwork", score: 0, comments: "" },
          { name: "Problem Solving", score: 0, comments: "" },
          { name: "Technical Skills", score: 0, comments: "" },
          { name: "Initiative", score: 0, comments: "" },
        ],
  );
  const [submitting, setSubmitting] = useState(false);

  const updateComp = (idx, field, value) => {
    const updated = [...competencies];
    updated[idx] = { ...updated[idx], [field]: value };
    setCompetencies(updated);
    // Auto-calculate overall score from competency scores
    const scores = updated.map((c) => c.score || 0).filter((s) => s > 0);
    if (scores.length > 0) {
      setOverallScore(
        parseFloat(
          (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
        ),
      );
    }
  };

  const handleSubmit = async () => {
    if (!managerRating) {
      toast.error("Please provide a manager rating");
      return;
    }
    if (!grade) {
      toast.error("Please select a grade");
      return;
    }
    if (!managerComments.trim()) {
      toast.error("Please add manager comments");
      return;
    }
    setSubmitting(true);
    await onSubmit({
      managerRating,
      managerComments,
      grade,
      overallScore,
      competencies,
      nextPeriodGoals: nextGoals
        .split("\n")
        .map((g) => g.trim())
        .filter(Boolean),
    });
    setSubmitting(false);
  };

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      {/* Competencies */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Competency Ratings
        </h4>
        <div className="space-y-3">
          {competencies.map((comp, i) => (
            <div
              key={`mgr-comp-${i}`}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {comp.name}
                </p>
                <StarRating
                  value={comp.score || 0}
                  onChange={(v) => updateComp(i, "score", v)}
                />
              </div>
              <input
                value={comp.comments || ""}
                onChange={(e) => updateComp(i, "comments", e.target.value)}
                placeholder="Add comments..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Overall Rating + Score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Manager Rating <span className="text-red-500">*</span>
          </label>
          <StarRating
            value={managerRating}
            onChange={setManagerRating}
            size="lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Overall Score (auto-calculated)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-primary-600">
              {overallScore || "—"}
            </span>
            <span className="text-gray-500 text-sm">/ 5.0</span>
          </div>
        </div>
      </div>

      {/* Grade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Final Grade <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <button
              key={`grade-${g.value}`}
              onClick={() => setGrade(g.value)}
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                grade === g.value
                  ? `${g.color} border-current shadow-sm`
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Manager Comments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Manager Comments <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          value={managerComments}
          onChange={(e) => setManagerComments(e.target.value)}
          placeholder="Provide detailed feedback on performance..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      {/* Next Goals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Goals for Next Period{" "}
          <span className="text-xs text-gray-400">(one per line)</span>
        </label>
        <textarea
          rows={3}
          value={nextGoals}
          onChange={(e) => setNextGoals(e.target.value)}
          placeholder={"Goal 1\nGoal 2\nGoal 3"}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={handleSubmit} loading={submitting}>
          Submit Review
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

// ── Main Performance Component ────────────────────────────
const Performance = () => {
  const dispatch = useDispatch();
  const { myReviews, allReviews, loading } = useSelector((s) => s.performance);
  const { list: employees } = useSelector((s) => s.employees);
  const { user, isAdminOrHR, isManager } = useAuth();

  const canManage = isAdminOrHR || isManager;

  const [activeTab, setActiveTab] = useState("my-reviews");
  const [createModal, setCreateModal] = useState(false);
  const [actionModal, setActionModal] = useState({
    open: false,
    type: null,
    review: null,
  });
  const [createForm, setCreateForm] = useState({
    employeeId: "",
    quarter:
      new Date().getMonth() < 3
        ? 1
        : new Date().getMonth() < 6
          ? 2
          : new Date().getMonth() < 9
            ? 3
            : 4,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    dispatch(fetchMyReviews());
    if (canManage) {
      dispatch(fetchAllReviews());
      dispatch(fetchEmployees({ status: "active", limit: 100 }));
    }
  }, [dispatch, canManage]);

  const handleCreateReview = async () => {
    if (!createForm.employeeId) {
      toast.error("Please select an employee");
      return;
    }
    const res = await dispatch(createReview(createForm));
    if (!res.error) {
      toast.success("Performance review initiated!");
      setCreateModal(false);
      setCreateForm((f) => ({ ...f, employeeId: "" }));
    } else {
      toast.error(res.payload || "Failed to create review");
    }
  };

  const handleAction = (type, review) => {
    setActionModal({ open: true, type, review });
  };

  const handleSelfReviewSubmit = async (data) => {
    const res = await dispatch(
      submitSelfReview({ id: actionModal.review._id, data }),
    );
    if (!res.error) {
      toast.success("Self review submitted!");
      setActionModal({ open: false, type: null, review: null });
      dispatch(fetchMyReviews());
    } else {
      toast.error(res.payload || "Failed");
    }
  };

  const handleManagerReviewSubmit = async (data) => {
    const res = await dispatch(
      submitManagerReview({ id: actionModal.review._id, data }),
    );
    if (!res.error) {
      toast.success("Review completed!");
      setActionModal({ open: false, type: null, review: null });
      dispatch(fetchAllReviews());
    } else {
      toast.error(res.payload || "Failed");
    }
  };

  const reviewsToShow = activeTab === "my-reviews" ? myReviews : allReviews;

  const avgRating =
    myReviews.filter((r) => r.overallScore).length > 0
      ? (
          myReviews.reduce((s, r) => s + (r.overallScore || 0), 0) /
          myReviews.filter((r) => r.overallScore).length
        ).toFixed(1)
      : null;

  const pendingSelfReview = myReviews.filter(
    (r) => r.status === "draft",
  ).length;
  const pendingManagerReview = allReviews.filter(
    (r) => r.status === "manager-review",
  ).length;

  const tabs = [
    { id: "my-reviews", label: "My Reviews" },
    ...(canManage
      ? [
          {
            id: "all-reviews",
            label: `All Reviews${allReviews.length ? ` (${allReviews.length})` : ""}`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Performance Reviews
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track performance, goals, and employee growth
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateModal(true)}>
            <Plus className="w-4 h-4" /> Start Review
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "My Avg Rating",
            value: avgRating ? `${avgRating}/5` : "—",
            icon: Star,
            color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
          },
          {
            label: "Total Reviews",
            value: myReviews.length,
            icon: Award,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "Pending Self Review",
            value: pendingSelfReview,
            icon: User,
            color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
          },
          canManage
            ? {
                label: "Awaiting My Review",
                value: pendingManagerReview,
                icon: TrendingUp,
                color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
              }
            : {
                label: "Completed",
                value: myReviews.filter((r) => r.status === "acknowledged")
                  .length,
                icon: Check,
                color: "text-green-600 bg-green-50 dark:bg-green-900/20",
              },
        ].map((s, i) => (
          <motion.div
            key={`perf-stat-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${s.color} rounded-xl p-5 flex items-center gap-4`}
          >
            <s.icon className="w-8 h-8 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm font-medium mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-b-2 border-primary-600 text-primary-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : reviewsToShow.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No performance reviews yet
              </p>
              {canManage && (
                <Button
                  className="mt-4"
                  variant="secondary"
                  onClick={() => setCreateModal(true)}
                >
                  <Plus className="w-4 h-4" /> Create First Review
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviewsToShow.map((review) => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  onAction={handleAction}
                  canManage={canManage}
                  currentUserId={user?._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Review Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Initiate Performance Review"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={createForm.employeeId}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, employeeId: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.lastName} (
                  {e.employeeId || e.designation || e.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quarter
              </label>
              <select
                value={createForm.quarter}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    quarter: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {QUARTERS.map((q) => (
                  <option key={`q${q}`} value={q}>
                    Q{q}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                value={createForm.year}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    year: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={`yr-${y}`} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleCreateReview}>
              Initiate Review
            </Button>
            <Button variant="secondary" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Self / Manager Review Modal */}
      <Modal
        isOpen={actionModal.open}
        onClose={() =>
          setActionModal({ open: false, type: null, review: null })
        }
        title={
          actionModal.type === "self-review"
            ? "Submit Self Review"
            : "Submit Manager Review"
        }
        size="lg"
      >
        {actionModal.type === "self-review" && actionModal.review && (
          <SelfReviewModal
            review={actionModal.review}
            onClose={() =>
              setActionModal({ open: false, type: null, review: null })
            }
            onSubmit={handleSelfReviewSubmit}
          />
        )}
        {actionModal.type === "manager-review" && actionModal.review && (
          <ManagerReviewModal
            review={actionModal.review}
            onClose={() =>
              setActionModal({ open: false, type: null, review: null })
            }
            onSubmit={handleManagerReviewSubmit}
          />
        )}
      </Modal>
    </div>
  );
};

export default Performance;
