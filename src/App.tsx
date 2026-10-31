
import { useMemo, useState } from 'react';
import './App.css';

type Lead = {
  companyName?: string | null;
  websiteUrl?: string;
  companyUrl?: string;
  description?: string | null;
  industry?: string | null;
  employeeSize?: string | number | null;
  location?: string | null;
  contacts?: {
    emails?: string[];
    phones?: string[];
    contactPageUrl?: string;
  };
  contact?: {
    emails?: string[];
    phones?: string[];
    contactPageUrl?: string;
  };
  socialMedia?: Record<string, string>;
  technologies?: string[];
  decisionMakers?: {
    name: string;
    title: string;
    source?: string;
  }[];
  hiringSignals?: {
    hasCareersPage?: boolean;
    careersUrl?: string;
    openRolesMentioned?: string[];
  };
  growthSignals?: {
    signal: string;
    evidence: string;
  }[];
  fitScore?: {
    score: number;
    reasons?: string[];
  } | null;
  [key: string]: any;
};

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [page, setPage] = useState('Overview');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('All');
  const [urls, setUrls] = useState('');
  const [industries, setIndustries] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [sowLoading, setSowLoading] = useState(false);
  const [error, setError] = useState('');
  const [sow, setSow] = useState('');
  const [company, setCompany] = useState('');
  const [problem, setProblem] = useState('');
  const [cloud, setCloud] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [approvals, setApprovals] = useState<
    { id: string; title: string; type: string; status: string }[]
  >([]);

  const scored = useMemo(
    () =>
      leads.map((lead, index) => ({
        ...lead,
        _score: lead.fitScore?.score ?? 0,
        _id: String(index),
      })),
    [leads]
  );

  const filtered = scored.filter(
    (lead) =>
      (lead.companyName || lead.companyUrl || '')
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (priority === 'All' ||
        (lead._score >= 75
          ? 'Hot'
          : lead._score >= 45
            ? 'Warm'
            : 'Cold') === priority)
  );

  const hot = leads.filter((l) => (l.fitScore?.score ?? 0) >= 75).length;
  const warm = leads.filter(
    (l) => (l.fitScore?.score ?? 0) >= 45 && (l.fitScore?.score ?? 0) < 75
  ).length;

  async function discover() {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/leads/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: urls.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean),
          industries: industries.split(',').map((x) => x.trim()).filter(Boolean),
          keywords: keywords.split(',').map((x) => x.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : JSON.stringify(data.detail || 'Lead discovery failed')
        );
      }

      const mappedLeads: Lead[] = (data.leads || []).map((lead: Lead) => ({
        ...lead,
        companyUrl: lead.websiteUrl,
        contact: lead.contacts,
        fitScore: null,
      }));

      setLeads(mappedLeads);
      setPage('Qualified Leads');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function generateSow() {
    setError('');
    setSowLoading(true);

    try {
      const response = await fetch(`${API}/api/sow/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: company,
          problem_statement: problem,
          cloud_provider: cloud,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : JSON.stringify(data.detail || 'SOW generation failed')
        );
      }

      setSow(data.sow_markdown || '');

      setApprovals((current) => [
        {
          id: `SOW-${Date.now()}`,
          title: `SOW — ${company || 'New project'}`,
          type: 'Statement of Work',
          status: 'Awaiting review',
        },
        ...current,
      ]);

      setPage('SOW Generator');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSowLoading(false);
    }
  }

  function decide(id: string, approved: boolean) {
    setApprovals((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: approved ? 'Approved' : 'Rejected' }
          : item
      )
    );
  }

  const nav = [
    'Overview',
    'Lead Discovery',
    'Qualified Leads',
    'SOW Generator',
    'Approvals',
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div>
            <b>NEXUS</b>
            <small>Revenue intelligence</small>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        {nav.map((name, index) => (
          <button
            key={name}
            className={`nav ${page === name ? 'active' : ''}`}
            onClick={() => setPage(name)}
          >
            <span>{['▦', '⌕', '◎', '▤', '✓'][index]}</span>
            {name}
            {name === 'Approvals' &&
              approvals.filter((a) => a.status === 'Awaiting review').length >
                0 && (
                <em>
                  {
                    approvals.filter(
                      (a) => a.status === 'Awaiting review'
                    ).length
                  }
                </em>
              )}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="online-dot" /> AI pipeline <span>● Live</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="crumb">Workspace /</span> <b>{page}</b>
          </div>
          <div className="profile">
            <div className="avatar">A</div>
            <div>
              <b>Admin</b>
              <small>Sales operations</small>
            </div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">INTELLIGENT REVENUE OPERATIONS</div>
              <h1>
                {page === 'Overview' ? 'Revenue command center' : page}
              </h1>
              <p>
                Discover high-fit companies, qualify opportunities and scope
                projects in one workflow.
              </p>
            </div>
            <button
              className="primary"
              onClick={() => setPage('Lead Discovery')}
            >
              ＋ Find new leads
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          {page === 'Overview' && (
            <>
              <div className="metrics">
                <Metric
                  label="Total qualified leads"
                  value={leads.length.toString()}
                  note="From current discovery runs"
                />
                <Metric
                  label="Hot opportunities"
                  value={hot.toString()}
                  note="Fit score ≥ 75"
                />
                <Metric
                  label="Warm opportunities"
                  value={warm.toString()}
                  note="Fit score 45–74"
                />
                <Metric
                  label="Pending approvals"
                  value={approvals.filter(
                    (a) => a.status === 'Awaiting review'
                  ).length.toString()}
                  note="Human review required"
                />
              </div>

              <div className="grid-two">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>Unified workflow</h3>
                      <p>From company discovery to approved project scope</p>
                    </div>
                    <span className="tag">5 stages</span>
                  </div>

                  <div className="pipeline">
                    {[
                      ['01', 'Discover companies', 'B2B sourcing + website enrichment'],
                      ['02', 'Qualify leads', 'ICP fit, intent and urgency scoring'],
                      ['03', 'Analyze requirements', 'Customer history + problem assessment'],
                      ['04', 'Generate SOW', 'Scope, deliverables, architecture and cost'],
                      ['05', 'Human approval', 'Review, approve or reject before action'],
                    ].map((item) => (
                      <div className="stage" key={item[0]}>
                        <b>{item[0]}</b>
                        <div>
                          <strong>{item[1]}</strong>
                          <small>{item[2]}</small>
                        </div>
                        <span>→</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>Recent activity</h3>
                      <p>Latest pipeline updates</p>
                    </div>
                  </div>

                  {leads.slice(0, 4).map((lead, index) => (
                    <div className="activity" key={index}>
                      <div className="activity-icon">↗</div>
                      <div>
                        <b>{lead.companyName || lead.companyUrl}</b>
                        <small>Company enriched</small>
                      </div>
                    </div>
                  ))}

                  {!leads.length && (
                    <div className="empty">
                      No leads yet. Start with Lead Discovery to populate your
                      pipeline.
                    </div>
                  )}
                </section>
              </div>

              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h3>Priority opportunities</h3>
                    <p>Companies from your latest run</p>
                  </div>
                  <button
                    className="text-btn"
                    onClick={() => setPage('Qualified Leads')}
                  >
                    View all →
                  </button>
                </div>
                <LeadTable rows={scored.slice(0, 5)} onSelect={setSelected} />
              </section>
            </>
          )}

          {page === 'Lead Discovery' && (
            <section className="panel form-panel">
              <h3>Discover and enrich B2B companies</h3>
              <p>
                Enter company websites. The B2B intelligence actor crawls each
                site and extracts contacts, technology, decision-makers and
                buying signals.
              </p>

              <label>
                Company website URLs <span>One URL per line</span>
              </label>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder={'https://company-one.com\nhttps://company-two.com'}
                rows={5}
              />

              <div className="form-row">
                <div>
                  <label>Target industries</label>
                  <input
                    value={industries}
                    onChange={(e) => setIndustries(e.target.value)}
                    placeholder="SaaS, healthcare, fintech"
                  />
                </div>
                <div>
                  <label>ICP keywords</label>
                  <input
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="AI adoption, hiring, funding"
                  />
                </div>
              </div>

              <div className="info-strip">
                The actor enriches each website and returns company
                intelligence. Fit scores are not yet calculated.
              </div>

              <button
                className="primary"
                disabled={loading || !urls.trim()}
                onClick={discover}
              >
                {loading ? 'Running enrichment…' : 'Run B2B intelligence →'}
              </button>
            </section>
          )}

          {page === 'Qualified Leads' && (
            <section className="panel">
              <div className="toolbar">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search company or domain…"
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option>All</option>
                  <option>Hot</option>
                  <option>Warm</option>
                  <option>Cold</option>
                </select>
              </div>

              <LeadTable rows={filtered} onSelect={setSelected} />

              {!leads.length && (
                <div className="empty">
                  No enriched leads available. Run Lead Discovery first.
                </div>
              )}
            </section>
          )}

          {page === 'SOW Generator' && (
            <div className="grid-two sow-layout">
              <section className="panel form-panel">
                <h3>Generate a project SOW</h3>
                <p>
                  Convert a qualified customer's problem into a structured
                  project scope, architecture and preliminary estimate.
                </p>

                <label>Company name</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Select or enter company"
                />

                <label>Customer problem / requirements</label>
                <textarea
                  rows={7}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Describe the customer's business problem, desired outcome and requirements…"
                />

                <label>Preferred cloud provider</label>
                <select
                  value={cloud}
                  onChange={(e) => setCloud(e.target.value)}
                >
                  <option value="">Let AI recommend</option>
                  <option>AWS</option>
                  <option>Azure</option>
                  <option>Google Cloud</option>
                </select>

                <div className="info-strip">
                  SOW generation uses the existing CrewAI multi-agent pipeline.
                  Output must be reviewed by a human before it is shared with a
                  customer.
                </div>

                <button
                  className="primary"
                  disabled={sowLoading || problem.trim().length < 10}
                  onClick={generateSow}
                >
                  {sowLoading ? 'Generating SOW…' : 'Generate SOW →'}
                </button>
              </section>

              <section className="panel">
                <h3>What the SOW agent produces</h3>
                {[
                  'Business and technical requirements',
                  'Recommended technology stack',
                  'Solution architecture diagram',
                  'Preliminary cloud cost estimate',
                  'Scope, deliverables and assumptions',
                ].map((item) => (
                  <div className="check-row" key={item}>
                    <span>✓</span>
                    {item}
                  </div>
                ))}
              </section>

              {sow && (
                <section className="panel sow-output">
                  <div className="panel-head">
                    <h3>Generated SOW — review required</h3>
                    <button
                      className="text-btn"
                      onClick={() => navigator.clipboard.writeText(sow)}
                    >
                      Copy text
                    </button>
                  </div>
                  <pre>{sow}</pre>
                </section>
              )}
            </div>
          )}

          {page === 'Approvals' && (
            <section className="panel">
              <h3>Human approval queue</h3>
              <p>
                AI-generated outputs remain pending until a reviewer makes a
                decision.
              </p>

              {approvals.length ? (
                approvals.map((item) => (
                  <div className="approval" key={item.id}>
                    <div>
                      <b>{item.title}</b>
                      <small>
                        {item.type} · {item.id}
                      </small>
                    </div>

                    <div className="approval-actions">
                      {item.status === 'Awaiting review' ? (
                        <>
                          <button
                            className="outline"
                            onClick={() => decide(item.id, false)}
                          >
                            Reject
                          </button>
                          <button
                            className="primary small"
                            onClick={() => decide(item.id, true)}
                          >
                            Approve
                          </button>
                        </>
                      ) : (
                        <span className="tag">{item.status}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty">
                  Nothing waiting for approval. Generate a SOW to create a
                  review item.
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>
              ×
            </button>

            <div className="eyebrow">COMPANY INTELLIGENCE</div>
            <h2>{selected.companyName || selected.companyUrl}</h2>

            <a
              href={selected.companyUrl}
              target="_blank"
              rel="noreferrer"
            >
              {selected.companyUrl}
            </a>

            <div className="score-box">
              <b>—</b>
              <span>ICP fit score — not calculated yet</span>
            </div>

            <h3>Company overview</h3>
            <p>{selected.description || 'No company description found.'}</p>

            <h3>Industry and location</h3>
            <p>{selected.industry || 'Unknown industry'}</p>
            <p>{selected.location || 'Location not found'}</p>
            <p>
              Employee size: {selected.employeeSize ?? 'Not available'}
            </p>

            <h3>Contact details</h3>
            <p>
              {selected.contact?.emails?.join(', ') || 'No emails found'}
            </p>
            <p>
              {selected.contact?.phones?.join(', ') || 'No phone numbers found'}
            </p>
            {selected.contact?.contactPageUrl && (
              <a
                href={selected.contact.contactPageUrl}
                target="_blank"
                rel="noreferrer"
              >
                Contact page
              </a>
            )}

            <h3>Decision-makers</h3>
{selected.decisionMakers?.length ? (
  selected.decisionMakers.map((person, index) => (
    <p key={index}>
      <b>{person.name}</b> - {person.title}
    </p>
  ))
) : (
  <p>No decision-makers found.</p>
)}
            

            <h3>Technologies</h3>
            <p>{selected.technologies?.join(', ') || 'Not detected'}</p>

            <h3>Growth signals</h3>
{selected.growthSignals?.length ? (
  selected.growthSignals.map((signal, index) => (
    <p key={index}>
      <b>{signal.signal}:</b> {signal.evidence}
    </p>
  ))
) : (
  <p>No growth signals found.</p>
)}

            <h3>Social profiles</h3>
            {selected.socialMedia &&
              Object.entries(selected.socialMedia).map(([name, url]) => (
                <p key={name}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {name}
                  </a>
                </p>
              ))}

            <button
              className="primary"
              onClick={() => {
                setCompany(selected.companyName || '');
                setPage('SOW Generator');
                setSelected(null);
              }}
            >
              Create SOW for this company →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function LeadTable({
  rows,
  onSelect,
}: {
  rows: any[];
  onSelect: (lead: Lead) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Contact</th>
            <th>ICP fit</th>
            <th>Priority</th>
            <th>Company size</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lead, index) => {
            const score = lead._score ?? 0;
            const priority =
              lead.fitScore?.score == null
                ? 'Unscored'
                : score >= 75
                  ? 'Hot'
                  : score >= 45
                    ? 'Warm'
                    : 'Cold';

            return (
              <tr
                key={lead._id || index}
                onClick={() => onSelect(lead)}
              >
                <td>
                  <b>{lead.companyName || lead.companyUrl || 'Unknown company'}</b>
                  <small>{lead.companyUrl}</small>
                </td>
                <td>{lead.contact?.emails?.[0] || '—'}</td>
                <td>
                  <b>—</b>
                  <small>Not scored</small>
                </td>
                <td>
                  <span className={`priority ${priority.toLowerCase()}`}>
                    {priority}
                  </span>
                </td>
                <td>{lead.employeeSize ?? 'Unknown'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
