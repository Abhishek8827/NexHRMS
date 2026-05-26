import { useRef } from "react";
import { Download, Printer } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";
import { MONTHS } from "../../utils/constants";

const Row = ({ label, value, bold, negative, highlight }) => (
  <div
    className={`flex justify-between py-2 px-4 text-sm ${
      highlight ? "bg-gray-50 font-semibold" : ""
    } border-b border-gray-100`}
  >
    <span className={`${bold ? "font-semibold" : ""} text-gray-700`}>
      {label}
    </span>
    <span
      className={`font-mono ${
        negative
          ? "text-red-600"
          : bold
            ? "text-gray-900 font-bold"
            : "text-gray-700"
      }`}
    >
      {negative && value > 0 ? "-" : ""}
      {formatCurrency(value || 0)}
    </span>
  </div>
);

const PayslipPDF = ({ record }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Payslip — ${record.employee?.firstName} ${record.employee?.lastName} — ${MONTHS[record.month - 1]} ${record.year}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 13px; color: #333; }
            .payslip { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: #1d4ed8; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .section-title { background: #f1f5f9; padding: 8px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
            .row { display: flex; justify-content: space-between; padding: 8px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .net { background: #eff6ff; padding: 12px 16px; font-weight: bold; font-size: 15px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; }
            .info-item label { font-size: 11px; color: #94a3b8; text-transform: uppercase; }
            .info-item p { font-weight: 600; color: #1e293b; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Payslip Content */}
      <div
        ref={printRef}
        className="payslip border border-gray-200 rounded-xl overflow-hidden bg-white"
      >
        {/* Header */}
        <div className="header bg-primary-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold">NexHR</h1>
              <p className="text-primary-200 text-sm mt-1">Salary Payslip</p>
            </div>
            <div className="text-right">
              <p className="text-primary-200 text-sm">Pay Period</p>
              <p className="font-bold text-lg">
                {MONTHS[record.month - 1]} {record.year}
              </p>
            </div>
          </div>
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 border-b border-gray-200">
          {[
            {
              label: "Employee Name",
              value: `${record.employee?.firstName || ""} ${record.employee?.lastName || ""}`,
            },
            { label: "Employee ID", value: record.employee?.employeeId || "—" },
            {
              label: "Designation",
              value: record.employee?.designation || "—",
            },
            {
              label: "Department",
              value: record.employee?.department?.name || "—",
            },
            { label: "Working Days", value: record.workingDays || "—" },
            { label: "Present Days", value: record.presentDays || "—" },
            { label: "LOP Days", value: record.lopDays || 0 },
            {
              label: "Pay Date",
              value: record.paidAt
                ? new Date(record.paidAt).toLocaleDateString("en-IN")
                : "—",
            },
          ].map((item) => (
            <div key={item.label} className="info-item">
              <label className="block text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                {item.label}
              </label>
              <p className="text-sm font-semibold text-gray-800">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Earnings + Deductions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          {/* Earnings */}
          <div>
            <div className="section-title px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-green-50">
              Earnings
            </div>
            <Row label="Basic Salary" value={record.basicSalary} />
            <Row label="HRA" value={record.hra} />
            <Row
              label="Conveyance Allowance"
              value={record.conveyanceAllowance}
            />
            <Row label="Medical Allowance" value={record.medicalAllowance} />
            <Row label="Special Allowance" value={record.specialAllowance} />
            {record.overtimePay > 0 && (
              <Row label="Overtime Pay" value={record.overtimePay} />
            )}
            {record.bonus > 0 && <Row label="Bonus" value={record.bonus} />}
            {record.arrears > 0 && (
              <Row label="Arrears" value={record.arrears} />
            )}
            <Row
              label="Gross Salary"
              value={record.grossSalary}
              bold
              highlight
            />
          </div>

          {/* Deductions */}
          <div>
            <div className="section-title px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-red-50">
              Deductions
            </div>
            <Row
              label="EPF (Employee 12%)"
              value={record.epfEmployee}
              negative
            />
            <Row label="EPF (Employer 12%)" value={record.epfEmployer} />
            <Row
              label="ESIC (Employee 0.75%)"
              value={record.esicEmployee}
              negative
            />
            <Row label="ESIC (Employer 3.25%)" value={record.esicEmployer} />
            <Row
              label="Professional Tax"
              value={record.professionalTax}
              negative
            />
            {record.tds > 0 && <Row label="TDS" value={record.tds} negative />}
            {record.loanDeduction > 0 && (
              <Row
                label="Loan Deduction"
                value={record.loanDeduction}
                negative
              />
            )}
            {record.lopDeduction > 0 && (
              <Row label="LOP Deduction" value={record.lopDeduction} negative />
            )}
            <Row
              label="Total Deductions"
              value={record.totalDeductions}
              bold
              highlight
            />
          </div>
        </div>

        {/* Net Salary */}
        <div className="flex justify-between items-center p-5 bg-primary-50 border-t border-primary-200">
          <div>
            <p className="text-sm text-primary-600 font-medium">
              Net Salary (Take Home)
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Gross - Employee Deductions
            </p>
          </div>
          <p className="text-2xl font-bold text-primary-700 font-mono">
            {formatCurrency(record.netSalary)}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            This is a computer-generated payslip and does not require a
            signature. | NexHR Payroll System
          </p>
        </div>
      </div>
    </div>
  );
};

export default PayslipPDF;
