import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";

const TEMPLATE = [
  "Employee ID,Attendance Code,First Name,Last Name,Phone,Designation,Department,Joining Date,Basic Salary",
  ",,,,,,,,",
].join("\r\n");

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const EmployeeSpreadsheetImport = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmedCount, setConfirmedCount] = useState(null);

  const records = useMemo(() => preview?.records || [], [preview]);
  const readyRows = useMemo(() => records.filter((record) => !record.errors?.length && record.employee), [records]);
  const skippedRows = records.length - readyRows.length;

  const loadHistory = async () => {
    try {
      const response = await api.get("/employees/imports");
      setHistory(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load employee import history.");
    }
  };

  useEffect(() => {
    let active = true;
    api.get("/employees/imports")
      .then((response) => { if (active) setHistory(response.data.data || []); })
      .catch((error) => { if (active) toast.error(error.response?.data?.message || "Unable to load employee import history."); });
    return () => { active = false; };
  }, []);

  const handlePreview = async (event) => {
    event.preventDefault();
    if (!file) {
      toast.error("Choose an .xlsx or .csv spreadsheet first.");
      return;
    }
    setPreviewing(true);
    setPreview(null);
    setConfirmedCount(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await api.post("/employees/imports/preview", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(response.data.data);
      toast.success("Preview ready. No employee records have been changed.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to preview this spreadsheet.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview?._id || !readyRows.length) return;
    const approved = window.confirm(
      `Apply ${readyRows.length} reviewed employee updates? ${skippedRows} invalid row(s) will be skipped. This will not create accounts or overwrite fields that were blank in the spreadsheet.`,
    );
    if (!approved) return;

    setConfirming(true);
    try {
      const response = await api.post(`/employees/imports/${preview._id}/confirm`, { confirm: true });
      setConfirmedCount(response.data.data.importedRecordCount);
      setPreview((current) => ({ ...current, status: "imported" }));
      toast.success(`${response.data.data.importedRecordCount} employee records updated.`);
      await loadHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to confirm this import.");
    } finally {
      setConfirming(false);
    }
  };

  const downloadOriginal = async (importId, fileName) => {
    if (!importId) return;
    try {
      const response = await api.get(`/employees/imports/${importId}/original`, { responseType: "blob" });
      saveBlob(response.data, fileName || "employee-import.xlsx");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to download the original spreadsheet.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Import employee spreadsheet</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Preview exact account matches and field-by-field changes before confirming.
        </p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Prepare a spreadsheet</h2>
            <p className="mt-1 text-xs text-gray-500">.xlsx or UTF-8 .csv, up to 5 MB and 1,000 employee rows.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => saveBlob(new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" }), "nexhrms-employee-import-template.csv")}
          >
            <Download className="h-4 w-4" /> Download template
          </Button>
        </div>

        <form onSubmit={handlePreview} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Spreadsheet
            <input
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setPreview(null);
                setConfirmedCount(null);
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </label>
          <Button type="submit" loading={previewing} disabled={!file || previewing}>
            <FileUp className="h-4 w-4" /> Preview spreadsheet
          </Button>
        </form>

        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          Match rows using Employee ID and/or Attendance Code only; names and email are never used for matching. Blank cells leave existing values unchanged. The import updates existing non-Admin profiles only—it does not create accounts, change roles/status, or change email/Firebase login identity. New account creation remains in the existing Add Employee flow.
        </div>
      </section>

      {preview && (
        <section className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900 dark:bg-blue-950/20 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review import preview</h2>
              <p className="mt-1 text-sm text-gray-500">{preview.fileName} · {records.length} data rows · {preview.status}</p>
            </div>
            <Badge color={skippedRows ? "yellow" : "green"}>{skippedRows ? `${skippedRows} row(s) need correction` : "Ready to update"}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[["Ready to update", readyRows.length], ["Skipped rows", skippedRows], ["Warnings", records.reduce((sum, row) => sum + (row.warnings?.length || 0), 0)]].map(([label, count]) => (
              <div key={label} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{count}</p>
                <p className="mt-1 text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {skippedRows > 0 && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Invalid or unmatched rows will be skipped; they are not silently applied.
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <table className="min-w-[900px] w-full text-left">
              <thead className="border-b border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
                <tr>{["Row", "Matched profile", "Proposed changes", "Errors / warnings"].map((heading) => <th key={heading} className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{heading}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {records.map((record) => (
                  <tr key={`${record.rowNumber}-${record.identifier}`} className="align-top">
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{record.rowNumber}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 dark:text-white">{record.employeeLabel || record.identifier || "Unmatched"}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-300">
                      {record.diff?.length ? <ul className="space-y-1">{record.diff.map((change) => <li key={change.field}><strong>{change.label || change.field}:</strong> {change.before} → {change.after}</li>)}</ul> : "No changes"}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {record.errors?.map((message) => <p key={message} className="mb-1 text-red-600">{message}</p>)}
                      {record.warnings?.map((message) => <p key={message} className="mb-1 text-amber-700 dark:text-amber-300">{message}</p>)}
                      {!record.errors?.length && !record.warnings?.length && <span className="text-green-700 dark:text-green-300">Valid</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={() => downloadOriginal(preview._id, preview.fileName)}>
              <FileSpreadsheet className="h-4 w-4" /> Download original
            </Button>
            {preview.status === "previewed" && (
              <Button onClick={handleConfirm} loading={confirming} disabled={!readyRows.length || confirming}>
                <CheckCircle2 className="h-4 w-4" /> Explicitly confirm and update {readyRows.length} row(s)
              </Button>
            )}
            {confirmedCount !== null && <p className="text-sm font-medium text-green-700 dark:text-green-300">Confirmed: {confirmedCount} profile(s) updated.</p>}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent spreadsheet imports</h2>
            <p className="mt-1 text-xs text-gray-500">Original files and confirmation details are retained for audit.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-left">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>{["File", "Status", "Rows", "Updated", "Uploaded"].map((heading) => <th key={heading} className="px-3 py-2 text-xs font-semibold uppercase text-gray-500">{heading}</th>)}<th className="px-3 py-2" /></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.map((item) => (
                  <tr key={item._id}>
                    <td className="px-3 py-3 text-sm text-gray-900 dark:text-white">{item.fileName}</td>
                    <td className="px-3 py-3 text-sm"><Badge color={item.status === "imported" ? "green" : "yellow"}>{item.status}</Badge></td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">{item.rowCount}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">{item.importedRecordCount || 0}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right"><Button type="button" variant="secondary" size="sm" onClick={() => downloadOriginal(item._id, item.fileName)}>Original</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default EmployeeSpreadsheetImport;
