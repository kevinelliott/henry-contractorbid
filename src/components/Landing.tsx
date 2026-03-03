"use client";

interface LandingProps { onStart: () => void; }

export function Landing({ onStart }: LandingProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔨</span>
          <span className="text-xl font-bold">ContractorBid</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#pricing" className="text-gray-400 hover:text-white text-sm">Pricing</a>
          <button onClick={onStart} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Try Free →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm px-4 py-1.5 rounded-full mb-6">
          Built for contractors, plumbers, electricians, roofers & trades
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Stop losing money on<br />
          <span className="text-orange-400">bad bids.</span>
        </h1>
        <p className="text-xl text-gray-400 mb-4 max-w-2xl mx-auto">
          The average contractor underbids by <strong className="text-white">$2,400</strong> because they forget line items or miscalculate markup. ContractorBid catches every gap before you hit send.
        </p>
        <p className="text-gray-500 mb-10">Professional estimates in 10 minutes. Bid strength score. Scope protection built-in. $19/mo.</p>
        <div className="flex gap-4 justify-center">
          <button onClick={onStart} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold">
            Create Your First Bid Free →
          </button>
          <a href="#how" className="border border-gray-700 text-gray-300 hover:border-gray-500 px-8 py-4 rounded-xl text-lg">
            See How It Works
          </a>
        </div>
        <p className="text-gray-600 text-sm mt-4">No credit card required · Free for first 3 bids</p>
      </section>

      {/* Problem / Social Proof */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-orange-400">$2,400</div>
              <div className="text-gray-400 mt-2">avg underbid loss per job</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-400">3.2hrs</div>
              <div className="text-gray-400 mt-2">avg time writing quotes manually</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-400">1 in 3</div>
              <div className="text-gray-400 mt-2">bids lost due to unprofessional presentation</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Professional bids in 4 steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: "1", title: "Project Info", desc: "Client, address, trade type, project scope" },
            { step: "2", title: "Line Items", desc: "Add materials & labor — our calculator catches missing items" },
            { step: "3", title: "Markup & Margin", desc: "Set your target margin, see exact profit per item" },
            { step: "4", title: "Review & Download", desc: "Bid Strength Score A-F + professional PDF-ready document" },
          ].map((s) => (
            <div key={s.step} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">
                {s.step}
              </div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Intelligence Features */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Intelligence built for your trade</h2>
          <p className="text-center text-gray-400 mb-12">Not just a form — a system that grades your bid before it goes out</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: "📊", title: "Bid Strength Score (A–F)", desc: "Grades completeness, scope protection, payment terms, and profit margin. Know your bid is solid before you send it." },
              { icon: "💰", title: "True Margin Calculator", desc: "Material markup ≠ profit. See your actual margin after overhead so you never underbid again." },
              { icon: "🛡️", title: "Scope Protection Clauses", desc: "Auto-adds exclusions, change order language, and lien rights language based on your trade and state." },
              { icon: "⚠️", title: "Missing Line Item Alerts", desc: "Pattern-matched against common trade checklists. Catches forgotten permits, disposal, mobilization costs." },
              { icon: "📋", title: "Payment Schedule Builder", desc: "Deposit + milestone + final — structured payment terms prevent late-pay nightmares." },
              { icon: "📄", title: "Professional Bid Document", desc: "Formatted proposal with your logo, itemized breakdown, terms, and signature block. Hand it to any client." },
            ].map((f) => (
              <div key={f.title} className="bg-gray-950 border border-gray-800 rounded-xl p-6 flex gap-4">
                <div className="text-3xl">{f.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">vs. the competition</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 text-gray-400">Feature</th>
                <th className="text-center py-3 text-orange-400 font-bold">ContractorBid</th>
                <th className="text-center py-3 text-gray-400">Word/Excel</th>
                <th className="text-center py-3 text-gray-400">Jobber ($49/mo)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Bid Strength Score", "✅", "❌", "❌"],
                ["Missing line item alerts", "✅", "❌", "❌"],
                ["True margin calculator", "✅", "Manual", "Basic"],
                ["Scope protection clauses", "✅", "❌", "❌"],
                ["Payment schedule builder", "✅", "Manual", "✅"],
                ["Professional document", "✅", "⚠️ Manual", "✅"],
                ["Price", "$19/mo", "Free", "$49/mo"],
              ].map(([feat, us, word, jobber]) => (
                <tr key={String(feat)} className="border-b border-gray-900 hover:bg-gray-900/50">
                  <td className="py-3 text-gray-300">{feat}</td>
                  <td className="py-3 text-center font-medium">{us}</td>
                  <td className="py-3 text-center text-gray-500">{word}</td>
                  <td className="py-3 text-center text-gray-500">{jobber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Simple pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Free", price: "$0", period: "forever", features: ["3 bids/month", "Basic line item builder", "Downloadable document", "Bid Strength Score"], cta: "Start Free", highlight: false },
              { name: "Pro", price: "$19", period: "/month", features: ["Unlimited bids", "Missing item alerts", "Scope protection clauses", "True margin calculator", "Payment schedule builder", "Client library", "Remove watermark"], cta: "Start Pro Trial", highlight: true },
              { name: "Team", price: "$49", period: "/month", features: ["Everything in Pro", "Up to 5 users", "Company branding", "Bid templates library", "Priority support"], cta: "Contact Sales", highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-xl p-6 border ${plan.highlight ? "bg-orange-500/10 border-orange-500" : "bg-gray-950 border-gray-800"}`}>
                {plan.highlight && <div className="text-orange-400 text-xs font-bold mb-3 uppercase tracking-wide">Most Popular</div>}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onStart} className={`w-full py-2.5 rounded-lg font-semibold text-sm ${plan.highlight ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-white"}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">One won bid typically pays for a year of Pro. No contracts, cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl">🔨</span>
          <span className="font-bold text-gray-400">ContractorBid</span>
        </div>
        <p>Professional estimates for contractors, plumbers, electricians, roofers & trades.</p>
        <p className="mt-1">© 2026 ContractorBid. All rights reserved.</p>
      </footer>
    </div>
  );
}
