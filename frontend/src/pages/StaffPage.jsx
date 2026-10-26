import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, Ban, Shield, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

export default function StaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Doctor');
  const [badgeUid, setBadgeUid] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await api.getStaff();
      setStaffList(res.data || []);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await api.createStaff({
        staff_id: staffId,
        name,
        role,
        badge_uid: badgeUid.toUpperCase(),
        status
      });
      setShowModal(false);
      // Reset form
      setStaffId('');
      setName('');
      setBadgeUid('');
      loadStaff();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create staff member');
    }
  };

  const handleToggleStatus = async (staffMember) => {
    const nextStatus = staffMember.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      await api.updateStaffStatus(staffMember.staff_id, nextStatus);
      loadStaff();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>Staff Management</h2>
          <p>Register healthcare professionals and manage RFID access badge credentials</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={loadStaff} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button id="btn-add-staff" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Staff
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header-box">
          <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Registered Hospital Staff Roster</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Total Staff: {staffList.length}
          </span>
        </div>

        <div className="table-responsive">
          <table id="staff-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>RFID UID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s.staff_id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                    {s.staff_id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>
                    <span className={`badge ${
                      s.role === 'Doctor' ? 'badge-doctor' : s.role === 'Nurse' ? 'badge-nurse' : 'badge-supervisor'
                    }`}>
                      {s.role}
                    </span>
                  </td>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, color: '#334155' }}>
                      {s.badge_uid}
                    </code>
                  </td>
                  <td>
                    <span className={`badge ${
                      s.status === 'ACTIVE'
                        ? 'status-registered'
                        : s.status === 'REVOKED'
                        ? 'status-revoked'
                        : 'status-invalid'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <button
                      id={`btn-revoke-${s.staff_id}`}
                      className={`btn btn-sm ${s.status === 'ACTIVE' ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => handleToggleStatus(s)}
                    >
                      {s.status === 'ACTIVE' ? (
                        <>
                          <Ban size={13} /> Revoke Card
                        </>
                      ) : (
                        <>
                          <UserCheck size={13} color="#16a34a" /> Re-Activate Card
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Healthcare Staff Member</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddStaff}>
              <div className="modal-body">
                {errorMessage && (
                  <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '14px' }}>
                    {errorMessage}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="staff_id">Staff ID</label>
                  <input
                    id="staff_id"
                    type="text"
                    className="form-control"
                    placeholder="e.g. STF007"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="staff_name">Full Name</label>
                  <input
                    id="staff_name"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Dr. Jane Foster"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="staff_role">Role</label>
                  <select
                    id="staff_role"
                    className="form-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="badge_uid">RFID Badge UID (Hex)</label>
                  <input
                    id="badge_uid"
                    type="text"
                    className="form-control"
                    placeholder="e.g. F1E2D3C4"
                    value={badgeUid}
                    onChange={(e) => setBadgeUid(e.target.value.toUpperCase())}
                    required
                  />
                  <small style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', marginTop: '4px' }}>
                    Tap card on RC522 or enter uppercase hex string.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="staff_status">Initial Status</label>
                  <select
                    id="staff_status"
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="REVOKED">REVOKED</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button id="btn-save-staff" type="submit" className="btn btn-primary">
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
