
import React, { useState, useEffect } from 'react';

// Centralized Role-Based Access Control (RBAC) Configuration
const ROLES = {
  POLICYHOLDER: 'Policyholder',
  CLAIMS_OFFICER: 'Claims Officer',
  VERIFICATION_OFFICER: 'Verification Officer',
  FINANCE_TEAM: 'Finance Team',
  ADMIN: 'Admin',
};

// Standardized Status Keys and UI Labels Mapping
const STATUS_MAP = {
  PENDING_SUBMISSION: { label: 'Pending Submission', colorClass: 'status-pending-submission', workflowOrder: 0 },
  SUBMITTED: { label: 'Submitted', colorClass: 'status-submitted', workflowOrder: 1 },
  IN_REVIEW: { label: 'In Review', colorClass: 'status-in-review', workflowOrder: 2 },
  PENDING_VERIFICATION: { label: 'Pending Verification', colorClass: 'status-pending-verification', workflowOrder: 3 },
  APPROVED: { label: 'Approved', colorClass: 'status-approved', workflowOrder: 4 },
  REJECTED: { label: 'Rejected', colorClass: 'status-rejected', workflowOrder: 4 }, // Rejection is also a final state
  SETTLED: { label: 'Settled', colorClass: 'status-settled', workflowOrder: 5 },
  WITHDRAWN: { label: 'Withdrawn', colorClass: 'status-withdrawn', workflowOrder: 0 }, // Can be withdrawn at any stage
};

const WORKFLOW_STAGES = [
  'PENDING_SUBMISSION',
  'SUBMITTED',
  'IN_REVIEW',
  'PENDING_VERIFICATION',
  'APPROVED/REJECTED', // Grouped for visual simplicity
  'SETTLED',
];

// Dummy Data Generation
const generateDummyData = () => {
  const users = [
    { id: 'usr-001', name: 'Alice Smith', email: 'alice.s@example.com', role: ROLES.POLICYHOLDER },
    { id: 'usr-002', name: 'Bob Johnson', email: 'bob.j@example.com', role: ROLES.CLAIMS_OFFICER },
    { id: 'usr-003', name: 'Charlie Brown', email: 'charlie.b@example.com', role: ROLES.VERIFICATION_OFFICER },
    { id: 'usr-004', name: 'Diana Prince', email: 'diana.p@example.com', role: ROLES.FINANCE_TEAM },
    { id: 'usr-005', name: 'Eve Adams', email: 'eve.a@example.com', role: ROLES.ADMIN },
    { id: 'usr-006', name: 'Frank White', email: 'frank.w@example.com', role: ROLES.POLICYHOLDER },
    { id: 'usr-007', name: 'Grace Lee', email: 'grace.l@example.com', role: ROLES.CLAIMS_OFFICER },
  ];

  const policies = [
    { id: 'pol-001', holderId: 'usr-001', number: 'INS-001-2023-A', type: 'Auto Insurance', premium: 1200, startDate: '2023-01-01', endDate: '2023-12-31' },
    { id: 'pol-002', holderId: 'usr-001', number: 'INS-002-2023-H', type: 'Home Insurance', premium: 2500, startDate: '2023-03-15', endDate: '2024-03-14' },
    { id: 'pol-003', holderId: 'usr-006', number: 'INS-003-2023-L', type: 'Life Insurance', premium: 800, startDate: '2022-06-01', endDate: '2042-05-31' },
    { id: 'pol-004', holderId: 'usr-006', number: 'INS-004-2023-M', type: 'Medical Insurance', premium: 1800, startDate: '2023-02-01', endDate: '2024-01-31' },
  ];

  const claims = [
    {
      id: 'CLM-001', policyId: 'pol-001', holderId: 'usr-001', title: 'Front Bumper Damage', description: 'Accident with another vehicle, front bumper requires replacement.',
      submissionDate: '2023-04-01', lastUpdate: '2023-04-10', status: 'APPROVED', amountClaimed: 1500, amountSettled: 1400, documents: [{ name: 'police_report.pdf', url: '#' }, { name: 'damage_photos.zip', url: '#' }]
    },
    {
      id: 'CLM-002', policyId: 'pol-002', holderId: 'usr-001', title: 'Water Leak in Kitchen', description: 'Burst pipe under kitchen sink caused floor damage.',
      submissionDate: '2023-04-05', lastUpdate: '2023-04-12', status: 'IN_REVIEW', amountClaimed: 3200, documents: [{ name: 'plumber_report.pdf', url: '#' }]
    },
    {
      id: 'CLM-003', policyId: 'pol-001', holderId: 'usr-001', title: 'Side Mirror Broken', description: 'Vandalism incident, left side mirror needs replacement.',
      submissionDate: '2023-04-10', lastUpdate: '2023-04-11', status: 'PENDING_VERIFICATION', amountClaimed: 450, documents: [{ name: 'photo_mirror.jpg', url: '#' }]
    },
    {
      id: 'CLM-004', policyId: 'pol-003', holderId: 'usr-006', title: 'Critical Illness Benefit', description: 'Claim for critical illness diagnosis as per policy terms.',
      submissionDate: '2023-03-20', lastUpdate: '2023-04-01', status: 'SETTLED', amountClaimed: 50000, amountSettled: 50000, documents: [{ name: 'medical_report.pdf', url: '#' }]
    },
    {
      id: 'CLM-005', policyId: 'pol-004', holderId: 'usr-006', title: 'Hospitalization Expenses', description: 'Emergency hospitalization for appendicitis.',
      submissionDate: '2023-04-15', lastUpdate: '2023-04-16', status: 'SUBMITTED', amountClaimed: 7800, documents: [{ name: 'hospital_bill.pdf', url: '#' }]
    },
    {
      id: 'CLM-006', policyId: 'pol-002', holderId: 'usr-001', title: 'Roof Damage from Storm', description: 'High winds caused shingles to detach from roof.',
      submissionDate: '2023-04-18', lastUpdate: '2023-04-18', status: 'PENDING_SUBMISSION', amountClaimed: 6000, documents: []
    },
    {
      id: 'CLM-007', policyId: 'pol-004', holderId: 'usr-006', title: 'Dental Procedure', description: 'Routine dental check-up and filling.',
      submissionDate: '2023-04-20', lastUpdate: '2023-04-20', status: 'REJECTED', amountClaimed: 300, documents: [{ name: 'dental_invoice.pdf', url: '#' }]
    },
  ];

  const auditLogs = [
    { id: 'aud-001', entity: 'CLM-001', type: 'status_change', by: 'Bob Johnson', role: ROLES.CLAIMS_OFFICER, timestamp: '2023-04-10T10:30:00Z', details: 'Status changed from In Review to Approved' },
    { id: 'aud-002', entity: 'CLM-002', type: 'document_upload', by: 'Alice Smith', role: ROLES.POLICYHOLDER, timestamp: '2023-04-05T14:15:00Z', details: 'Uploaded plumber_report.pdf' },
    { id: 'aud-003', entity: 'CLM-003', type: 'status_change', by: 'Charlie Brown', role: ROLES.VERIFICATION_OFFICER, timestamp: '2023-04-11T09:00:00Z', details: 'Status changed from In Review to Pending Verification' },
    { id: 'aud-004', entity: 'CLM-004', type: 'status_change', by: 'Diana Prince', role: ROLES.FINANCE_TEAM, timestamp: '2023-04-01T16:00:00Z', details: 'Status changed from Approved to Settled' },
  ];

  return { users, policies, claims, auditLogs };
};

function App() {
  const { users, policies, claims: initialClaims, auditLogs: initialAuditLogs } = generateDummyData();
  const [view, setView] = useState({ screen: 'LOGIN', params: {} });
  const [currentUser, setCurrentUser] = useState(null);
  const [claims, setClaims] = useState(initialClaims);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Function for full-screen navigation
  const navigate = (screen, params = {}) => {
    setView({ screen, params });
    setIsDropdownOpen(false); // Close dropdown on navigation
  };

  // Simulate user login
  const handleLogin = (roleId) => {
    const user = users.find(u => u.id === roleId);
    if (user) {
      setCurrentUser(user);
      navigate('DASHBOARD');
    } else {
      alert('Invalid user role selected.');
    }
  };

  // Simulate user logout
  const handleLogout = () => {
    setCurrentUser(null);
    navigate('LOGIN');
  };

  // Handle updates to claims (immutability rule)
  const handleUpdateClaim = (updatedClaim) => {
    setClaims(prevClaims => prevClaims.map(claim =>
      claim.id === updatedClaim.id ? { ...claim, ...updatedClaim, lastUpdate: new Date().toISOString().split('T')[0] } : claim
    ));
    setAuditLogs(prevLogs => [
      ...prevLogs,
      {
        id: `aud-${Date.now()}`,
        entity: updatedClaim.id,
        type: 'claim_update',
        by: currentUser?.name || 'System',
        role: currentUser?.role || 'System',
        timestamp: new Date().toISOString(),
        details: `Claim updated, status changed to ${STATUS_MAP[updatedClaim.status]?.label || updatedClaim.status}`,
      }
    ]);
  };

  // Handle creation of new claim (immutability rule)
  const handleCreateClaim = (newClaimData) => {
    const newClaim = {
      id: `CLM-${String(claims.length + 1).padStart(3, '0')}`,
      submissionDate: new Date().toISOString().split('T')[0],
      lastUpdate: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED', // Default status for new claims
      ...newClaimData,
      holderId: currentUser?.id, // Auto-populate for policyholder
    };
    setClaims(prevClaims => [...prevClaims, newClaim]);
    setAuditLogs(prevLogs => [
      ...prevLogs,
      {
        id: `aud-${Date.now()}`,
        entity: newClaim.id,
        type: 'claim_creation',
        by: currentUser?.name || 'System',
        role: currentUser?.role || 'System',
        timestamp: new Date().toISOString(),
        details: `New claim created with status ${STATUS_MAP[newClaim.status]?.label}`,
      }
    ]);
    navigate('CLAIM_DETAIL', { claimId: newClaim.id });
  };

  // Filter claims based on current user role and global search
  const getFilteredClaims = () => {
    let filtered = claims;

    if (currentUser?.role === ROLES.POLICYHOLDER) {
      filtered = filtered.filter(claim => claim.holderId === currentUser.id);
    }

    if (globalSearchTerm) {
      const lowerCaseSearch = globalSearchTerm.toLowerCase();
      filtered = filtered.filter(claim =>
        claim.id.toLowerCase().includes(lowerCaseSearch) ||
        claim.title.toLowerCase().includes(lowerCaseSearch) ||
        claim.description.toLowerCase().includes(lowerCaseSearch) ||
        STATUS_MAP[claim.status]?.label.toLowerCase().includes(lowerCaseSearch)
      );
    }
    return filtered.sort((a,b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
  };

  // --- UI Components ---

  const Breadcrumbs = ({ path }) => (
    <div className="breadcrumbs">
      <a href="#" onClick={() => navigate('DASHBOARD')}>Dashboard</a>
      {' > '}
      {path.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && ' > '}
          {item.onClick ? (
            <a href="#" onClick={item.onClick}>{item.label}</a>
          ) : (
            <span>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const Header = () => (
    <header className="header">
      <div className="header-brand" onClick={() => navigate('DASHBOARD')} style={{ cursor: 'pointer' }}>
        Insurance Platform
      </div>
      <div className="header-search">
        <input
          type="text"
          placeholder="Global Search..."
          value={globalSearchTerm}
          onChange={(e) => setGlobalSearchTerm(e.target.value)}
        />
        {/* Smart suggestions would appear here */}
      </div>
      <nav className="header-nav">
        {(currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.CLAIMS_OFFICER) && (
          <a href="#" className="header-nav-item" onClick={() => navigate('DASHBOARD')}>Dashboard</a>
        )}
        {(currentUser?.role !== ROLES.POLICYHOLDER) && (
          <a href="#" className="header-nav-item" onClick={() => navigate('CLAIM_LIST')}>Claims</a>
        )}
        {(currentUser?.role === ROLES.POLICYHOLDER) && (
          <a href="#" className="header-nav-item" onClick={() => navigate('CLAIM_LIST', { myClaims: true })}>My Claims</a>
        )}
        {(currentUser?.role === ROLES.ADMIN) && (
          <a href="#" className="header-nav-item" onClick={() => navigate('USER_LIST')}>Users</a>
        )}
        {(currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.CLAIMS_OFFICER) && (
          <a href="#" className="header-nav-item" onClick={() => navigate('POLICY_LIST')}>Policies</a>
        )}
      </nav>
      <div className="header-user-menu" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        <img src="https://via.placeholder.com/32/cccccc/000000?text=U" alt="User Avatar" />
        <span>{currentUser?.name || 'Guest'}</span>
        {isDropdownOpen && (
          <div className="header-user-dropdown">
            <button type="button" onClick={() => navigate('PROFILE')}>Profile</button>
            <button type="button" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </header>
  );

  const StatusBadge = ({ status }) => {
    const statusInfo = STATUS_MAP[status];
    if (!statusInfo) return null;
    return (
      <span className={`status-badge ${statusInfo.colorClass}`}>
        {statusInfo.label}
      </span>
    );
  };

  const ClaimCard = ({ claim }) => {
    const policy = policies.find(p => p.id === claim.policyId);
    const holder = users.find(u => u.id === claim.holderId);
    return (
      <div className="card clickable-card" onClick={() => navigate('CLAIM_DETAIL', { claimId: claim.id })}>
        <div className="card-header">
          <h3 className="card-title">{claim.title}</h3>
          <StatusBadge status={claim.status} />
        </div>
        <div className="card-body">
          <p><strong>Claim ID:</strong> {claim.id}</p>
          <p><strong>Policy:</strong> {policy?.number || 'N/A'}</p>
          <p><strong>Policyholder:</strong> {holder?.name || 'N/A'}</p>
          <p><strong>Amount:</strong> ${claim.amountClaimed?.toLocaleString()}</p>
          <p className="card-meta">Last Update: {claim.lastUpdate}</p>
        </div>
      </div>
    );
  };

  const PolicyCard = ({ policy }) => {
    const holder = users.find(u => u.id === policy.holderId);
    return (
      <div className="card clickable-card" onClick={() => navigate('POLICY_DETAIL', { policyId: policy.id })}>
        <div className="card-header">
          <h3 className="card-title">{policy.type}</h3>
          <p className="card-meta">Policy ID: {policy.id}</p>
        </div>
        <div className="card-body">
          <p><strong>Policy Number:</strong> {policy.number}</p>
          <p><strong>Policyholder:</strong> {holder?.name || 'N/A'}</p>
          <p><strong>Premium:</strong> ${policy.premium?.toLocaleString()}</p>
          <p><strong>Duration:</strong> {policy.startDate} to {policy.endDate}</p>
        </div>
      </div>
    );
  };

  const UserCard = ({ user }) => (
    <div className="card clickable-card" onClick={() => navigate('USER_DETAIL', { userId: user.id })}>
      <div className="card-header">
        <h3 className="card-title">{user.name}</h3>
        <span className="card-meta">{user.role}</span>
      </div>
      <div className="card-body">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
      </div>
    </div>
  );

  // --- Screens ---

  const LoginScreen = () => {
    const [selectedRole, setSelectedRole] = useState(users[0]?.id || '');

    useEffect(() => {
      if (users.length > 0) {
        setSelectedRole(users[0].id);
      }
    }, [users]);

    const onSubmit = (e) => {
      e.preventDefault();
      if (selectedRole) {
        handleLogin(selectedRole);
      }
    };

    return (
      <div className="login-screen">
        <div className="login-card">
          <h2>Welcome to Insurance Platform</h2>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="user-select">Login As:</label>
              <select
                id="user-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ marginBottom: 'var(--spacing-md)' }}
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="button-primary">Login</button>
          </form>
        </div>
      </div>
    );
  };

  const DashboardScreen = () => {
    const claimsOfficerDashboard = currentUser?.role === ROLES.CLAIMS_OFFICER || currentUser?.role === ROLES.ADMIN;
    const policyholderClaims = claims.filter(c => c.holderId === currentUser?.id);
    const displayedClaims = currentUser?.role === ROLES.POLICYHOLDER ? policyholderClaims : claims;

    const totalClaims = displayedClaims.length;
    const approvedClaims = displayedClaims.filter(c => c.status === 'APPROVED').length;
    const pendingClaims = displayedClaims.filter(c => c.status === 'IN_REVIEW' || c.status === 'PENDING_VERIFICATION' || c.status === 'SUBMITTED').length;
    const settledClaims = displayedClaims.filter(c => c.status === 'SETTLED').length;

    const recentActivities = auditLogs
      .filter(log => (currentUser?.role === ROLES.POLICYHOLDER ? (claims.find(c => c.id === log.entity)?.holderId === currentUser?.id) : true))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    return (
      <div className="main-content">
        <h1>Dashboard <span className="live-pulse" style={{ fontSize: 'var(--font-size-base)' }}>● Live</span></h1>

        <div className="dashboard-grid">
          <div className="card kpi-card">
            <h3>Total Claims</h3>
            <div className="kpi-value">{totalClaims}</div>
          </div>
          <div className="card kpi-card" style={{ borderLeftColor: 'var(--status-approved)' }}>
            <h3>Approved Claims</h3>
            <div className="kpi-value">{approvedClaims}</div>
          </div>
          <div className="card kpi-card" style={{ borderLeftColor: 'var(--status-in-review)' }}>
            <h3>Pending Claims</h3>
            <div className="kpi-value">{pendingClaims}</div>
          </div>
          <div className="card kpi-card" style={{ borderLeftColor: 'var(--status-settled)' }}>
            <h3>Settled Claims</h3>
            <div className="kpi-value">{settledClaims}</div>
          </div>
        </div>

        {claimsOfficerDashboard && (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
            <div className="card">
              <h2 className="card-title">Claim Trends (Charts)</h2>
              <div style={{ minHeight: '300px', backgroundColor: 'var(--color-background-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)' }}>
                {/* Placeholder for Bar, Line, Donut, Gauge Charts */}
                <p>Chart Visualizations Here</p>
              </div>
            </div>
            <div className="card recent-activities-panel">
              <h2 className="card-title">Recent Activities</h2>
              <div className="card-body">
                {recentActivities.length > 0 ? (
                  recentActivities.map(activity => (
                    <div className="activity-item" key={activity.id}>
                      <div className="activity-icon">i</div>
                      <div className="activity-text">
                        <span>{activity.by}</span> {activity.details} (Claim: {activity.entity})
                      </div>
                      <div className="activity-time">{new Date(activity.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))
                ) : (
                  <p>No recent activities.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <h2 style={{ marginTop: 'var(--spacing-xl)' }}>
          {currentUser?.role === ROLES.POLICYHOLDER ? 'My Recent Claims' : 'Recent Claims'}
        </h2>
        {displayedClaims.length > 0 ? (
          <div className="card-list-grid">
            {displayedClaims.slice(0, 4).map(claim => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        ) : (
          <div className="card text-center">
            <h3>No Claims Found</h3>
            <p>It looks like there are no claims to display yet.</p>
            {currentUser?.role === ROLES.POLICYHOLDER && (
              <button type="button" className="button-primary" onClick={() => navigate('CLAIM_FORM', { mode: 'create' })}>Submit New Claim</button>
            )}
          </div>
        )}
      </div>
    );
  };

  const ClaimListScreen = () => {
    const listClaims = getFilteredClaims();
    const canCreateClaim = (currentUser?.role === ROLES.POLICYHOLDER); // Policyholder creates claims, others manage

    return (
      <div className="main-content">
        <Breadcrumbs path={[{ label: 'Claims' }]} />
        <div className="list-view-header">
          <h1>{currentUser?.role === ROLES.POLICYHOLDER ? 'My Claims' : 'All Claims'}</h1>
          <div className="list-view-controls">
            <button type="button" className="button-outline">Filter</button> {/* Placeholder for side panel filters */}
            <button type="button" className="button-outline">Sort</button>
            <button type="button" className="button-outline">Export</button> {/* Placeholder for Export */}
            {canCreateClaim && (
              <button type="button" className="button-primary" onClick={() => navigate('CLAIM_FORM', { mode: 'create' })}>
                + New Claim
              </button>
            )}
            {/* Saved Views placeholder */}
            <button type="button" className="button-outline">Saved Views</button>
          </div>
        </div>

        {listClaims.length > 0 ? (
          <div className="card-list-grid">
            {listClaims.map(claim => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        ) : (
          <div className="card text-center">
            <h3>No Claims Found</h3>
            <p>Adjust your search or filters.</p>
            {canCreateClaim && (
              <button type="button" className="button-primary" onClick={() => navigate('CLAIM_FORM', { mode: 'create' })}>Submit New Claim</button>
            )}
          </div>
        )}
      </div>
    );
  };

  const ClaimDetailScreen = () => {
    const { claimId } = view.params;
    const claim = claims.find(c => c.id === claimId);
    const policy = policies.find(p => p.id === claim?.policyId);
    const holder = users.find(u => u.id === claim?.holderId);
    const claimAuditLogs = auditLogs.filter(log => log.entity === claimId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (!claim) {
      return (
        <div className="main-content">
          <Breadcrumbs path={[{ label: 'Claims', onClick: () => navigate('CLAIM_LIST') }, { label: 'Claim Not Found' }]} />
          <div className="card text-center">
            <h2>Claim Not Found</h2>
            <p>The claim you are looking for does not exist.</p>
            <button type="button" className="button-primary" onClick={() => navigate('CLAIM_LIST')}>Back to Claims</button>
          </div>
        </div>
      );
    }

    // RBAC for actions
    const canEdit = (currentUser?.role === ROLES.CLAIMS_OFFICER || currentUser?.role === ROLES.ADMIN || (currentUser?.role === ROLES.POLICYHOLDER && claim?.status === 'PENDING_SUBMISSION'));
    const canApprove = (currentUser?.role === ROLES.CLAIMS_OFFICER || currentUser?.role === ROLES.ADMIN);
    const canVerify = (currentUser?.role === ROLES.VERIFICATION_OFFICER || currentUser?.role === ROLES.ADMIN);
    const canSettle = (currentUser?.role === ROLES.FINANCE_TEAM || currentUser?.role === ROLES.ADMIN);

    const handleApprove = () => {
      if (window.confirm('Are you sure you want to approve this claim?')) {
        handleUpdateClaim({ ...claim, status: 'APPROVED' });
        alert(`Claim ${claim.id} approved.`);
        navigate('CLAIM_DETAIL', { claimId: claim.id }); // Refresh view
      }
    };

    const handleReject = () => {
      if (window.confirm('Are you sure you want to reject this claim?')) {
        handleUpdateClaim({ ...claim, status: 'REJECTED' });
        alert(`Claim ${claim.id} rejected.`);
        navigate('CLAIM_DETAIL', { claimId: claim.id });
      }
    };

    const handleSettle = () => {
      if (window.confirm('Are you sure you want to settle this claim?')) {
        handleUpdateClaim({ ...claim, status: 'SETTLED', amountSettled: claim.amountClaimed });
        alert(`Claim ${claim.id} settled.`);
        navigate('CLAIM_DETAIL', { claimId: claim.id });
      }
    };

    // Calculate current workflow stage for visual tracker
    const currentWorkflowStageIndex = STATUS_MAP[claim.status]?.workflowOrder || 0;
    const isRejectedOrWithdrawn = claim.status === 'REJECTED' || claim.status === 'WITHDRAWN';

    return (
      <div className="main-content">
        <Breadcrumbs path={[{ label: 'Claims', onClick: () => navigate('CLAIM_LIST') }, { label: claim.id }]} />

        <h1 className="mb-md">{claim.title} <StatusBadge status={claim.status} /></h1>

        {/* Workflow Tracker Card */}
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h3 className="card-title">Claim Workflow Status</h3>
          <div className="workflow-tracker">
            {WORKFLOW_STAGES.map((stage, index) => {
              const stageStatus = stage.includes('/') ? (claim.status === 'APPROVED' || claim.status === 'REJECTED' ? claim.status : 'IN_REVIEW') : claim.status;
              const isCurrent = (STATUS_MAP[stageStatus]?.workflowOrder === index && !isRejectedOrWithdrawn) || (isRejectedOrWithdrawn && stage === 'APPROVED/REJECTED' && index === currentWorkflowStageIndex);
              const isCompleted = STATUS_MAP[claim.status]?.workflowOrder > index || (isRejectedOrWithdrawn && index < currentWorkflowStageIndex);

              return (
                <div key={stage} className={`workflow-step ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}>
                  <div className="workflow-step-circle">{index + 1}</div>
                  <div className="workflow-step-label">{stage}</div>
                </div>
              );
            })}
          </div>
          {/* SLA Tracking Placeholder */}
          <p className="card-meta" style={{textAlign: 'right', marginTop: 'var(--spacing-md)'}}>
            SLA: 5 days for current stage. Status: <span style={{color: 'var(--color-accent)'}}>On Track</span>
          </p>
        </div>

        <div className="detail-layout">
          <div className="detail-main">
            {/* Claim Details Card */}
            <div className="card">
              <h3 className="card-title">Claim Overview</h3>
              <div className="card-body">
                <p><strong>Claim ID:</strong> {claim.id}</p>
                <p><strong>Description:</strong> {claim.description}</p>
                <p><strong>Submission Date:</strong> {claim.submissionDate}</p>
                <p><strong>Last Update:</strong> {claim.lastUpdate}</p>
                <p><strong>Amount Claimed:</strong> ${claim.amountClaimed?.toLocaleString()}</p>
                {claim.status === 'SETTLED' && <p><strong>Amount Settled:</strong> ${claim.amountSettled?.toLocaleString()}</p>}
              </div>
            </div>

            {/* Documents Card */}
            <div className="card">
              <h3 className="card-title">Supporting Documents ({claim?.documents?.length || 0})</h3>
              <div className="card-body">
                {claim?.documents?.length > 0 ? (
                  <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                    {claim.documents.map((doc, index) => (
                      <li key={index} style={{ marginBottom: 'var(--spacing-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                        <button type="button" className="button-outline" style={{padding: 'var(--spacing-xs) var(--spacing-sm)'}}>Preview</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="card-meta">No documents uploaded.</p>
                )}
              </div>
            </div>

            {/* Audit Log Card */}
            <div className="card">
              <h3 className="card-title">Audit Trail</h3>
              <div className="card-body">
                {claimAuditLogs.length > 0 ? (
                  <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                    {claimAuditLogs.map(log => (
                      <li key={log.id} className="audit-log-item">
                        <strong>{log.by} ({log.role})</strong>: {log.details}
                        <div className="log-time">{new Date(log.timestamp).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="card-meta">No audit logs for this claim.</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="detail-actions">
              {canEdit && (claim.status !== 'APPROVED' && claim.status !== 'REJECTED' && claim.status !== 'SETTLED') && (
                <button type="button" className="button-secondary" onClick={() => navigate('CLAIM_FORM', { mode: 'edit', claimId: claim.id })}>
                  Edit Claim
                </button>
              )}
              {canApprove && claim.status === 'IN_REVIEW' && (
                <button type="button" className="button-accent" style={{backgroundColor: 'var(--color-accent)', color: 'white'}} onClick={handleApprove}>
                  Approve
                </button>
              )}
              {canVerify && claim.status === 'PENDING_VERIFICATION' && (
                <button type="button" className="button-primary" onClick={() => handleUpdateClaim({ ...claim, status: 'IN_REVIEW' })}>
                  Mark Verified (to In Review)
                </button>
              )}
              {canApprove && claim.status !== 'APPROVED' && claim.status !== 'REJECTED' && claim.status !== 'SETTLED' && (
                <button type="button" className="button-danger" onClick={handleReject}>
                  Reject
                </button>
              )}
              {canSettle && claim.status === 'APPROVED' && (
                <button type="button" className="button-primary" onClick={handleSettle}>
                  Settle Claim
                </button>
              )}
            </div>
          </div>

          <div className="detail-sidebar">
            {/* Related Policy Card */}
            <div className="card">
              <h3 className="card-title">Related Policy</h3>
              {policy ? (
                <div className="card-body">
                  <p><strong>Policy Number:</strong> <a href="#" onClick={() => navigate('POLICY_DETAIL', { policyId: policy.id })}>{policy.number}</a></p>
                  <p><strong>Type:</strong> {policy.type}</p>
                  <p><strong>Policyholder:</strong> <a href="#" onClick={() => navigate('USER_DETAIL', { userId: holder?.id })}>{holder?.name}</a></p>
                  <p><strong>Valid:</strong> {policy.startDate} to {policy.endDate}</p>
                </div>
              ) : (
                <p className="card-meta">Policy details not available.</p>
              )}
            </div>

            {/* Other Related Records (Placeholder) */}
            <div className="card">
              <h3 className="card-title">Communication History</h3>
              <p className="card-meta">Emails, Chat logs etc. would be displayed here.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ClaimFormScreen = () => {
    const { mode, claimId } = view.params;
    const isEditMode = mode === 'edit';
    const claimToEdit = isEditMode ? claims.find(c => c.id === claimId) : null;

    const [formData, setFormData] = useState({
      title: claimToEdit?.title || '',
      description: claimToEdit?.description || '',
      policyId: claimToEdit?.policyId || '',
      amountClaimed: claimToEdit?.amountClaimed || '',
      documents: claimToEdit?.documents || [],
    });

    const [errors, setErrors] = useState({});
    const [selectedFiles, setSelectedFiles] = useState([]);

    const userPolicies = policies.filter(p => p.holderId === currentUser?.id);

    // Auto-populate policy if only one exists for the policyholder
    useEffect(() => {
      if (!isEditMode && userPolicies.length === 1 && !formData.policyId) {
        setFormData(prev => ({ ...prev, policyId: userPolicies[0].id }));
      }
    }, [isEditMode, userPolicies, formData.policyId]);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: undefined })); // Clear error on change
      }
    };

    const handleFileChange = (e) => {
      const newFiles = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        fileObject: file, // Store the actual file object for potential upload
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    const handleRemoveFile = (index) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
      const newErrors = {};
      if (!formData.title) newErrors.title = 'Title is mandatory.';
      if (!formData.description) newErrors.description = 'Description is mandatory.';
      if (!formData.policyId) newErrors.policyId = 'Policy selection is mandatory.';
      if (!formData.amountClaimed || formData.amountClaimed <= 0) newErrors.amountClaimed = 'Claim amount must be greater than 0.';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!validateForm()) {
        return;
      }

      const updatedDocuments = [
        ...formData.documents, // Existing documents
        ...selectedFiles.map(f => ({ name: f.name, url: '#' })), // New documents (mock URL)
      ];

      if (isEditMode) {
        handleUpdateClaim({
          ...claimToEdit,
          ...formData,
          documents: updatedDocuments,
        });
        alert('Claim updated successfully!');
      } else {
        handleCreateClaim({
          ...formData,
          documents: updatedDocuments,
        });
        alert('Claim submitted successfully!');
      }
    };

    return (
      <div className="main-content">
        <Breadcrumbs path={[{ label: 'Claims', onClick: () => navigate('CLAIM_LIST') }, { label: isEditMode ? 'Edit Claim' : 'New Claim' }]} />
        <div className="card">
          <h1 className="card-title">{isEditMode ? `Edit Claim: ${claimToEdit?.id}` : 'Submit New Claim'}</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Claim Title <span style={{color: 'var(--color-danger)'}}>*</span></label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
              {errors.title && <div className="error-message">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description <span style={{color: 'var(--color-danger)'}}>*</span></label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} required></textarea>
              {errors.description && <div className="error-message">{errors.description}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="policyId">Associated Policy <span style={{color: 'var(--color-danger)'}}>*</span></label>
              <select id="policyId" name="policyId" value={formData.policyId} onChange={handleChange} required>
                <option value="">Select a policy</option>
                {userPolicies.map(policy => (
                  <option key={policy.id} value={policy.id}>{policy.number} ({policy.type})</option>
                ))}
              </select>
              {errors.policyId && <div className="error-message">{errors.policyId}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="amountClaimed">Amount Claimed <span style={{color: 'var(--color-danger)'}}>*</span></label>
              <input type="number" id="amountClaimed" name="amountClaimed" value={formData.amountClaimed} onChange={handleChange} required min="1" />
              {errors.amountClaimed && <div className="error-message">{errors.amountClaimed}</div>}
            </div>

            <div className="form-group">
              <label>Supporting Documents</label>
              <div className="file-upload-input">
                <input type="file" multiple onChange={handleFileChange} id="file-upload" />
                <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', width: '100%' }}>
                  Click to upload files
                  {/* Icon placeholder */}
                  <span style={{ fontSize: 'var(--font-size-lg)' }}>📁</span>
                </label>
              </div>
              <div className="uploaded-files">
                {[...formData.documents, ...selectedFiles].map((file, index) => (
                  <div key={index} className="uploaded-file-item">
                    <span className="file-name">{file.name}</span>
                    <button type="button" className="remove-file-btn" onClick={() => handleRemoveFile(index)}>X</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="button-secondary" onClick={() => isEditMode ? navigate('CLAIM_DETAIL', { claimId }) : navigate('CLAIM_LIST')}>
                Cancel
              </button>
              <button type="submit" className="button-primary">
                {isEditMode ? 'Save Changes' : 'Submit Claim'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Generic List Screens (Policy, User)
  const PolicyListScreen = () => {
    // RBAC: Only Admin/Claims Officer can view all policies
    if (currentUser?.role !== ROLES.ADMIN && currentUser?.role !== ROLES.CLAIMS_OFFICER) {
      return (
        <div className="main-content">
          <Breadcrumbs path={[{ label: 'Policies', onClick: () => navigate('DASHBOARD') }, { label: 'Access Denied' }]} />
          <div className="card text-center">
            <h2>Access Denied</h2>
            <p>You do not have permission to view this page.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="main-content">
        <Breadcrumbs path={[{ label: 'Policies' }]} />
        <div className="list-view-header">
          <h1>Policies</h1>
          <div className="list-view-controls">
            <button type="button" className="button-outline">Filter</button>
            <button type="button" className="button-outline">Sort</button>
            <button type="button" className="button-outline">Export</button>
          </div>
        </div>
        <div className="card-list-grid">
          {policies.map(policy => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </div>
      </div>
    );
  };

  const UserListScreen = () => {
    // RBAC: Only Admin can view user list
    if (currentUser?.role !== ROLES.ADMIN) {
      return (
        <div className="main-content">
          <Breadcrumbs path={[{ label: 'Users', onClick: () => navigate('DASHBOARD') }, { label: 'Access Denied' }]} />
          <div className="card text-center">
            <h2>Access Denied</h2>
            <p>You do not have permission to view this page.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="main-content">
        <Breadcrumbs path={[{ label: 'Users' }]} />
        <div className="list-view-header">
          <h1>Users</h1>
          <div className="list-view-controls">
            <button type="button" className="button-outline">Filter</button>
            <button type="button" className="button-outline">Sort</button>
            <button type="button" className="button-outline">Export</button>
          </div>
        </div>
        <div className="card-list-grid">
          {users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </div>
    );
  };

  const ProfileScreen = () => {
    if (!currentUser) {
      return (
        <div className="main-content">
          <Breadcrumbs path={[{ label: 'Profile' }, { label: 'Not Logged In' }]} />
          <div className="card text-center">
            <h2>Not Logged In</h2>
            <p>Please log in to view your profile.</p>
            <button type="button" className="button-primary" onClick={() => navigate('LOGIN')}>Go to Login</button>
          </div>
        </div>
      );
    }

    return (
      <div className="main-content">
        <Breadcrumbs path={[{ label: 'Profile' }]} />
        <div className="card">
          <h1 className="card-title">My Profile</h1>
          <div className="card-body">
            <p><strong>Name:</strong> {currentUser.name}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Role:</strong> {currentUser.role}</p>
            <p><strong>User ID:</strong> {currentUser.id}</p>
            {/* Further profile details like settings, preferences */}
          </div>
        </div>
      </div>
    );
  };

  // Main App rendering logic
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="app-container">
      <Header />
      {
        (view.screen === 'DASHBOARD' && <DashboardScreen />) ||
        (view.screen === 'CLAIM_LIST' && <ClaimListScreen />) ||
        (view.screen === 'CLAIM_DETAIL' && <ClaimDetailScreen />) ||
        (view.screen === 'CLAIM_FORM' && <ClaimFormScreen />) ||
        (view.screen === 'POLICY_LIST' && <PolicyListScreen />) ||
        (view.screen === 'USER_LIST' && <UserListScreen />) ||
        (view.screen === 'PROFILE' && <ProfileScreen />) ||
        // Fallback for unhandled routes
        (<div className="main-content"><div className="card text-center"><h2>404 - Page Not Found</h2><p>The screen you are trying to access does not exist.</p><button type="button" className="button-primary" onClick={() => navigate('DASHBOARD')}>Go to Dashboard</button></div></div>)
      }
    </div>
  );
}

export default App;