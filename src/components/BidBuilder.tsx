"use client";

import { useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface LineItem {
  id: string;
  description: string;
  category: "material" | "labor" | "equipment" | "permit" | "disposal" | "other";
  quantity: number;
  unit: string;
  unitCost: number;
  markupPct: number;
}

interface PaymentMilestone {
  label: string;
  pct: number;
  trigger: string;
}

interface BidData {
  // Step 1
  contractorName: string;
  contractorPhone: string;
  contractorEmail: string;
  trade: string;
  clientName: string;
  clientAddress: string;
  projectTitle: string;
  projectDesc: string;
  startDate: string;
  endDate: string;
  // Step 2
  lineItems: LineItem[];
  // Step 3
  overheadPct: number;
  targetMarginPct: number;
  paymentMilestones: PaymentMilestone[];
  // Step 4 (computed)
}

const TRADE_CHECKLISTS: Record<string, string[]> = {
  Plumbing: ["Permit fee", "Inspection fee", "Water heater disposal", "Old pipe disposal", "Cleanup/haul-away", "Mobilization"],
  Electrical: ["Permit fee", "Panel upgrade", "Wire disposal", "Conduit", "Junction boxes", "Grounding", "Final inspection"],
  Roofing: ["Old shingle disposal", "Underlayment", "Drip edge", "Flashing", "Ridge cap", "Dumpster rental", "Permit"],
  HVAC: ["Equipment disposal", "Duct sealing materials", "Permit fee", "Refrigerant", "Startup/commissioning"],
  Painting: ["Surface prep", "Primer", "Masking materials", "Drop cloths", "Cleanup", "Touch-up labor"],
  Carpentry: ["Lumber disposal", "Fasteners/hardware", "Finish materials", "Cleanup", "Permit (if structural)"],
  Concrete: ["Form materials", "Rebar", "Concrete disposal", "Curing compound", "Sealer", "Permit"],
  General: ["Mobilization", "Cleanup/haul-away", "Permit fee", "Supervision labor", "Contingency"],
};

const DEFAULT_MILESTONES: PaymentMilestone[] = [
  { label: "Deposit", pct: 33, trigger: "Upon signing" },
  { label: "Progress", pct: 33, trigger: "Midpoint completion" },
  { label: "Final", pct: 34, trigger: "Substantial completion" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

function calcItem(item: LineItem) {
  const base = item.quantity * item.unitCost;
  const marked = base * (1 + item.markupPct / 100);
  return { base, marked };
}

function bidScore(bid: BidData): { score: number; grade: string; issues: string[]; strengths: string[] } {
  const issues: string[] = [];
  const strengths: string[] = [];
  let score = 100;

  // Line items completeness
  const cats = new Set(bid.lineItems.map((l) => l.category));
  if (!cats.has("material") && bid.trade !== "Painting") { issues.push("No material line items — jobs without material lists often get scope disputes"); score -= 15; }
  else strengths.push("Materials itemized");
  if (!cats.has("labor")) { issues.push("No labor line items — client can't validate labor costs"); score -= 15; }
  else strengths.push("Labor itemized");
  if (!cats.has("permit") && bid.trade !== "Painting" && bid.trade !== "General") { issues.push("No permit line item — permits are required for most trades"); score -= 10; }
  if (!cats.has("disposal")) { issues.push("No disposal/haul-away — a common forgotten cost"); score -= 8; }

  // Margin
  const totalBase = bid.lineItems.reduce((s, i) => s + calcItem(i).base, 0);
  const totalMarked = bid.lineItems.reduce((s, i) => s + calcItem(i).marked, 0);
  const withOverhead = totalMarked * (1 + bid.overheadPct / 100);
  const actualMargin = totalBase > 0 ? ((withOverhead - totalBase) / withOverhead) * 100 : 0;
  if (actualMargin < 15) { issues.push(`True margin only ${actualMargin.toFixed(1)}% — risky below 15%`); score -= 12; }
  else if (actualMargin > 30) strengths.push(`Strong margin: ${actualMargin.toFixed(1)}%`);

  // Payment terms
  if (bid.paymentMilestones.length === 0) { issues.push("No payment milestones — single-pay = cash flow risk"); score -= 10; }
  else if (bid.paymentMilestones[0].pct >= 25) strengths.push("Deposit protects your materials cost");

  // Project info
  if (!bid.startDate || !bid.endDate) { issues.push("Missing timeline dates — disputes start with vague schedules"); score -= 8; }
  else strengths.push("Timeline documented");
  if (!bid.projectDesc || bid.projectDesc.length < 30) { issues.push("Thin project description — vague scope = change order battles"); score -= 10; }
  else strengths.push("Clear scope description");
  if (!bid.contractorPhone && !bid.contractorEmail) { issues.push("No contractor contact info on bid"); score -= 5; }

  const clampedScore = Math.max(0, Math.min(100, score));
  const grade = clampedScore >= 90 ? "A" : clampedScore >= 80 ? "B" : clampedScore >= 70 ? "C" : clampedScore >= 60 ? "D" : "F";
  return { score: clampedScore, grade, issues, strengths };
}

function generateBidText(bid: BidData): string {
  const totalBase = bid.lineItems.reduce((s, i) => s + calcItem(i).base, 0);
  const totalMarked = bid.lineItems.reduce((s, i) => s + calcItem(i).marked, 0);
  const totalWithOverhead = totalMarked * (1 + bid.overheadPct / 100);
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return `CONTRACTOR BID / ESTIMATE
${"=".repeat(60)}

CONTRACTOR
  ${bid.contractorName || "[Contractor Name]"}
  ${bid.contractorPhone ? `Phone: ${bid.contractorPhone}` : ""}
  ${bid.contractorEmail ? `Email: ${bid.contractorEmail}` : ""}
  Trade: ${bid.trade}

CLIENT
  ${bid.clientName || "[Client Name]"}
  ${bid.clientAddress || "[Client Address]"}

PROJECT
  ${bid.projectTitle || "[Project Title]"}
  ${bid.projectDesc || ""}
  Start: ${bid.startDate || "TBD"}
  Completion: ${bid.endDate || "TBD"}

${"─".repeat(60)}
LINE ITEMS
${"─".repeat(60)}
${"Category".padEnd(12)}${"Description".padEnd(30)}${"Qty".padEnd(6)}${"Unit$".padEnd(10)}${"Markup".padEnd(8)}${"Total"}
${bid.lineItems.map((item) => {
  const { marked } = calcItem(item);
  return `${item.category.padEnd(12)}${item.description.slice(0, 28).padEnd(30)}${String(item.quantity).padEnd(6)}${fmt(item.unitCost).padEnd(10)}${item.markupPct}%${" ".repeat(2)}${fmt(marked)}`;
}).join("\n")}

${"─".repeat(60)}
  Subtotal (materials/labor at markup):  ${fmt(totalMarked)}
  Overhead & insurance (${bid.overheadPct}%):           ${fmt(totalMarked * bid.overheadPct / 100)}
${"─".repeat(60)}
  TOTAL BID:                             ${fmt(totalWithOverhead)}

${"─".repeat(60)}
PAYMENT SCHEDULE
${bid.paymentMilestones.map((m) => `  ${m.label}: ${m.pct}% (${fmt(totalWithOverhead * m.pct / 100)}) — ${m.trigger}`).join("\n")}

${"─".repeat(60)}
SCOPE PROTECTION & TERMS

1. SCOPE OF WORK: This bid covers ONLY the work explicitly described above. Any additional work requested beyond this scope will require a written Change Order, signed by both parties, prior to commencement.

2. EXCLUSIONS: Unless explicitly listed above, this bid excludes: concealed damage discovered during work, hazardous material remediation (asbestos, mold, lead), structural repairs not visible at time of bidding, permit delays beyond contractor's control.

3. CHANGE ORDERS: All changes to scope, schedule, or materials must be documented in writing. Verbal agreements are not binding.

4. LATE PAYMENT: Invoices unpaid after 30 days subject to 1.5% monthly interest. Contractor reserves right to stop work on unpaid invoices after 10-day notice.

5. LIEN RIGHTS: Contractor reserves all lien rights under applicable state law. Failure to make scheduled payments may result in a mechanic's lien on the property.

6. WARRANTY: Workmanship warranted for 1 year from substantial completion. Material warranties per manufacturer. Warranty void if work is altered by others.

7. DISPUTES: Disputes shall be resolved by mediation prior to litigation. Prevailing party entitled to reasonable attorney's fees.

8. VALIDITY: This bid is valid for 30 days from date of issue. After 30 days, prices may change due to material cost fluctuations.

${"─".repeat(60)}
ACCEPTANCE

By signing below, Client accepts this bid and authorizes work to begin upon receipt of deposit.

Contractor Signature: _________________________ Date: __________

Client Signature: _____________________________ Date: __________

Printed Name: ________________________________

${"─".repeat(60)}
Generated by ContractorBid · https://henry-contractorbid.vercel.app
`;
}

// ── Step Components ───────────────────────────────────────────────────────────
function StepIndicator({ step, total }: { step: number; total: number }) {
  const labels = ["Project Info", "Line Items", "Markup & Payment", "Review & Download"];
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i + 1 === step ? "bg-orange-500 text-white" : i + 1 < step ? "bg-green-600 text-white" : "bg-gray-800 text-gray-500"}`}>
            {i + 1 < step ? "✓" : i + 1}
          </div>
          <span className={`text-sm hidden md:block ${i + 1 === step ? "text-white font-medium" : "text-gray-500"}`}>{labels[i]}</span>
          {i < total - 1 && <div className={`flex-1 h-0.5 w-8 ${i + 1 < step ? "bg-green-600" : "bg-gray-800"}`} />}
        </div>
      ))}
    </div>
  );
}

// ── Main BidBuilder ───────────────────────────────────────────────────────────
export function BidBuilder() {
  const [step, setStep] = useState(1);
  const [bid, setBid] = useState<BidData>({
    contractorName: "",
    contractorPhone: "",
    contractorEmail: "",
    trade: "General",
    clientName: "",
    clientAddress: "",
    projectTitle: "",
    projectDesc: "",
    startDate: "",
    endDate: "",
    lineItems: [],
    overheadPct: 10,
    targetMarginPct: 20,
    paymentMilestones: DEFAULT_MILESTONES,
  });

  const update = useCallback((patch: Partial<BidData>) => setBid((b) => ({ ...b, ...patch })), []);

  const addLineItem = () => {
    const newItem: LineItem = { id: uid(), description: "", category: "material", quantity: 1, unit: "each", unitCost: 0, markupPct: 20 };
    update({ lineItems: [...bid.lineItems, newItem] });
  };

  const updateLineItem = (id: string, patch: Partial<LineItem>) => {
    update({ lineItems: bid.lineItems.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  };

  const removeLineItem = (id: string) => update({ lineItems: bid.lineItems.filter((l) => l.id !== id) });

  const score = bidScore(bid);
  const totalBase = bid.lineItems.reduce((s, i) => s + calcItem(i).base, 0);
  const totalMarked = bid.lineItems.reduce((s, i) => s + calcItem(i).marked, 0);
  const totalWithOverhead = totalMarked * (1 + bid.overheadPct / 100);
  const trueProfitMargin = totalBase > 0 ? ((totalWithOverhead - totalBase) / totalWithOverhead) * 100 : 0;
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const missingChecklist = (TRADE_CHECKLISTS[bid.trade] || TRADE_CHECKLISTS.General).filter(
    (item) => !bid.lineItems.some((l) => l.description.toLowerCase().includes(item.toLowerCase().slice(0, 8)))
  );

  const download = () => {
    const text = generateBidText(bid);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bid-${(bid.clientName || "client").replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const gradeColor = { A: "text-green-400", B: "text-green-500", C: "text-yellow-400", D: "text-orange-400", F: "text-red-500" };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔨</span>
          <span className="text-xl font-bold">ContractorBid</span>
        </div>
        {step > 1 && totalWithOverhead > 0 && (
          <div className="flex items-center gap-4">
            <span className={`text-2xl font-bold ${gradeColor[score.grade as keyof typeof gradeColor]}`}>{score.grade}</span>
            <span className="text-gray-400 text-sm">Bid Score</span>
            <span className="text-white font-bold">{fmt(totalWithOverhead)}</span>
          </div>
        )}
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <StepIndicator step={step} total={4} />

        {/* STEP 1: Project Info */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Project Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Your Name / Company</label>
                <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none" value={bid.contractorName} onChange={(e) => update({ contractorName: e.target.value })} placeholder="Acme Contracting LLC" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Your Phone</label>
                <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none" value={bid.contractorPhone} onChange={(e) => update({ contractorPhone: e.target.value })} placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Your Email</label>
                <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none" value={bid.contractorEmail} onChange={(e) => update({ contractorEmail: e.target.value })} placeholder="you@company.com" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Trade</label>
                <select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none" value={bid.trade} onChange={(e) => update({ trade: e.target.value })}>
                  {Object.keys(TRADE_CHECKLISTS).map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Client Name</label>
                <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none" value={bid.clientName} onChange={(e) => update({ clientName: e.target.value })} placeholder="John Smith" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Client / Project Address</label>
                <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none" value={bid.clientAddress} onChange={(e) => update({ clientAddress: e.target.value })} placeholder="123 Main St, Anytown, CA 90210" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Project Title</label>
                <input className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none" value={bid.projectTitle} onChange={(e) => update({ projectTitle: e.target.value })} placeholder="Master Bath Plumbing Replacement" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Scope Description</label>
                <textarea className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none h-24 resize-none" value={bid.projectDesc} onChange={(e) => update({ projectDesc: e.target.value })} placeholder="Describe exactly what work is included. The more specific, the less scope disputes later..." />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                <input type="date" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none" value={bid.startDate} onChange={(e) => update({ startDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Estimated Completion Date</label>
                <input type="date" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none" value={bid.endDate} onChange={(e) => update({ endDate: e.target.value })} />
              </div>
            </div>
            <button onClick={() => setStep(2)} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold">
              Next: Add Line Items →
            </button>
          </div>
        )}

        {/* STEP 2: Line Items */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Line Items</h2>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-400">{fmt(totalMarked)}</div>
                <div className="text-sm text-gray-500">subtotal (before overhead)</div>
              </div>
            </div>

            {/* Checklist reminder */}
            {missingChecklist.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                <p className="text-yellow-400 font-medium text-sm mb-2">⚠️ Common {bid.trade} costs you might be forgetting:</p>
                <div className="flex flex-wrap gap-2">
                  {missingChecklist.map((item) => (
                    <button key={item} onClick={() => { const li: LineItem = { id: uid(), description: item, category: "other", quantity: 1, unit: "ea", unitCost: 0, markupPct: 0 }; update({ lineItems: [...bid.lineItems, li] }); }} className="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 text-xs px-3 py-1 rounded-full">
                      + {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Line items table */}
            <div className="space-y-3 mb-4">
              {bid.lineItems.length === 0 && (
                <div className="text-center py-12 text-gray-600 border border-dashed border-gray-800 rounded-xl">
                  No line items yet. Add materials, labor, permits, etc.
                </div>
              )}
              {bid.lineItems.map((item) => {
                const { base, marked } = calcItem(item);
                return (
                  <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-12 md:col-span-4">
                        <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" placeholder="Description" value={item.description} onChange={(e) => updateLineItem(item.id, { description: e.target.value })} />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" value={item.category} onChange={(e) => updateLineItem(item.id, { category: e.target.value as LineItem["category"] })}>
                          <option value="material">Material</option>
                          <option value="labor">Labor</option>
                          <option value="equipment">Equipment</option>
                          <option value="permit">Permit</option>
                          <option value="disposal">Disposal</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="col-span-3 md:col-span-1">
                        <input type="number" min={0} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" placeholder="Qty" value={item.quantity} onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="col-span-3 md:col-span-1">
                        <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" placeholder="Unit" value={item.unit} onChange={(e) => updateLineItem(item.id, { unit: e.target.value })} />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <input type="number" min={0} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" placeholder="Unit cost $" value={item.unitCost || ""} onChange={(e) => updateLineItem(item.id, { unitCost: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <div className="flex items-center gap-1">
                          <input type="number" min={0} max={200} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" placeholder="%" value={item.markupPct} onChange={(e) => updateLineItem(item.id, { markupPct: parseFloat(e.target.value) || 0 })} />
                          <span className="text-gray-500 text-xs">%</span>
                        </div>
                      </div>
                      <div className="col-span-4 md:col-span-1 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">{fmt(marked)}</div>
                          <div className="text-xs text-gray-500">cost: {fmt(base)}</div>
                        </div>
                        <button onClick={() => removeLineItem(item.id)} className="text-gray-600 hover:text-red-400 text-lg ml-2">✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={addLineItem} className="w-full border border-dashed border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 py-3 rounded-xl text-sm mb-6">
              + Add Line Item
            </button>

            {bid.lineItems.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-400">Your cost (no markup)</div>
                  <div className="font-bold">{fmt(totalBase)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Client pays (with markup)</div>
                  <div className="font-bold text-orange-400">{fmt(totalMarked)}</div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="border border-gray-700 text-gray-300 px-6 py-3 rounded-xl">← Back</button>
              <button onClick={() => setStep(3)} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold">Next: Markup & Payment →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Markup & Payment */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Markup, Overhead & Payment Terms</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Overhead & Profit</h3>
                <label className="block text-sm text-gray-400 mb-1">Overhead % (insurance, truck, tools, office)</label>
                <input type="number" min={0} max={50} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none mb-4" value={bid.overheadPct} onChange={(e) => update({ overheadPct: parseFloat(e.target.value) || 0 })} />

                <div className="bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Subtotal (at markup)</span><span>{fmt(totalMarked)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Overhead ({bid.overheadPct}%)</span><span>{fmt(totalMarked * bid.overheadPct / 100)}</span></div>
                  <div className="flex justify-between font-bold border-t border-gray-700 pt-2">
                    <span>Total Bid</span><span className="text-orange-400">{fmt(totalWithOverhead)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-2">
                    <span className="text-gray-400">Your true profit margin</span>
                    <span className={trueProfitMargin < 15 ? "text-red-400 font-bold" : trueProfitMargin > 25 ? "text-green-400 font-bold" : "text-yellow-400 font-bold"}>
                      {trueProfitMargin.toFixed(1)}%
                    </span>
                  </div>
                  {trueProfitMargin < 15 && <p className="text-red-400 text-xs">⚠️ Below 15% — industry minimum for sustainable contracting</p>}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Payment Schedule</h3>
                <div className="space-y-3">
                  {bid.paymentMilestones.map((m, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex gap-2 mb-2">
                        <input className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none" value={m.label} onChange={(e) => update({ paymentMilestones: bid.paymentMilestones.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                        <div className="flex items-center gap-1 w-20">
                          <input type="number" min={0} max={100} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none" value={m.pct} onChange={(e) => update({ paymentMilestones: bid.paymentMilestones.map((x, j) => j === i ? { ...x, pct: parseInt(e.target.value) || 0 } : x) })} />
                          <span className="text-gray-400 text-xs">%</span>
                        </div>
                      </div>
                      <input className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none" placeholder="Trigger condition" value={m.trigger} onChange={(e) => update({ paymentMilestones: bid.paymentMilestones.map((x, j) => j === i ? { ...x, trigger: e.target.value } : x) })} />
                      <div className="text-xs text-orange-400 mt-1">{fmt(totalWithOverhead * m.pct / 100)}</div>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Total: {bid.paymentMilestones.reduce((s, m) => s + m.pct, 0)}% 
                  {bid.paymentMilestones.reduce((s, m) => s + m.pct, 0) !== 100 && <span className="text-red-400"> (should equal 100%)</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="border border-gray-700 text-gray-300 px-6 py-3 rounded-xl">← Back</button>
              <button onClick={() => setStep(4)} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold">Review Bid →</button>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Bid Review</h2>

            {/* Score card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Bid Strength Score</h3>
                  <p className="text-gray-400 text-sm">How complete and protected is this bid?</p>
                </div>
                <div className="text-right">
                  <div className={`text-6xl font-black ${gradeColor[score.grade as keyof typeof gradeColor]}`}>{score.grade}</div>
                  <div className="text-gray-500 text-sm">{score.score}/100</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {score.issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-2">⚠️ Issues to Fix</h4>
                    <ul className="space-y-1">
                      {score.issues.map((issue, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-red-500 shrink-0">•</span>{issue}</li>)}
                    </ul>
                  </div>
                )}
                {score.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2">✓ Strengths</h4>
                    <ul className="space-y-1">
                      {score.strengths.map((s, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-green-500 shrink-0">•</span>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Bid", value: fmt(totalWithOverhead), color: "text-orange-400" },
                { label: "Your Cost", value: fmt(totalBase), color: "text-white" },
                { label: "True Profit", value: fmt(totalWithOverhead - totalBase), color: "text-green-400" },
                { label: "True Margin", value: `${trueProfitMargin.toFixed(1)}%`, color: trueProfitMargin >= 15 ? "text-green-400" : "text-red-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Scope protection included */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <p className="text-green-400 font-medium text-sm">✅ Your bid automatically includes:</p>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {["Change order language", "Late payment interest clause", "Lien rights reservation", "1-year workmanship warranty", "Exclusions clause", "30-day bid validity"].map((t) => (
                  <div key={t} className="text-xs text-gray-400 flex gap-1"><span className="text-green-500">✓</span>{t}</div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="border border-gray-700 text-gray-300 px-6 py-3 rounded-xl">← Back</button>
              <button onClick={download} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2">
                📄 Download Bid Document
              </button>
            </div>

            <p className="text-gray-600 text-xs mt-4">Download is a formatted text file. PDF export coming in Pro.</p>
          </div>
        )}
      </div>
    </div>
  );
}
