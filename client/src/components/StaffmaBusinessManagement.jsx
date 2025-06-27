import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllBusinesses, updateBusinessDetails, suspendBusiness, reactivateBusiness } from '../utils/api';

function StaffmaBusinessManagement() {
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModal, setEditModal] = useState({ show: false, business: null });
  const [suspendModal, setSuspendModal] = useState({ show: false, business: null });
  const [editForm, setEditForm] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: ''
  });
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const token = getToken('staffma');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch real business data from API
        const response = await getAllBusinesses();
        setBusinesses(response.businesses || []);
        setFilteredBusinesses(response.businesses || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        setError('Failed to fetch businesses: ' + error.message);
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [getToken]);

  useEffect(() => {
    const filtered = businesses.filter(business =>
      business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBusinesses(filtered);
  }, [searchTerm, businesses]);

  const getStatusColor = (business) => {
    if (business.isSuspended) return '#f44336'; // Red for suspended
    return business.totalActivities > 0 ? '#4caf50' : '#ff9800'; // Green for active, Orange for inactive
  };

  const getStatusText = (business) => {
    if (business.isSuspended) return 'Suspended';
    return business.totalActivities > 0 ? 'Active' : 'Inactive';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const handleEdit = (business) => {
    setEditForm({
      businessName: business.businessName || '',
      email: business.email || '',
      phone: business.phone || '',
      address: business.address || ''
    });
    setEditModal({ show: true, business });
  };

  const handleSuspend = (business) => {
    setSuspendModal({ show: true, business });
  };

  const handleReactivate = async (business) => {
    try {
      // Make API call to reactivate the business
      await reactivateBusiness(business._id);
      
      // Update local state to mark business as not suspended
      setBusinesses(prevBusinesses => 
        prevBusinesses.map(b => 
          b._id === business._id 
            ? { ...b, isSuspended: false }
            : b
        )
      );
      
      // You could add a success message here
    } catch (error) {
      console.error('Error reactivating business:', error);
      // You could add an error message here
    }
  };

  const handleEditSubmit = async () => {
    try {
      // Make API call to update the business
      await updateBusinessDetails(editModal.business._id, {
        businessName: editForm.businessName,
        email: editForm.email,
        contactNumber: editForm.phone,
        businessAddress: editForm.address
      });
      
      // Update local state
      setBusinesses(prevBusinesses => 
        prevBusinesses.map(business => 
          business._id === editModal.business._id 
            ? { 
                ...business, 
                businessName: editForm.businessName,
                email: editForm.email,
                contactNumber: editForm.phone,
                businessAddress: editForm.address
              }
            : business
        )
      );
      
      // Close the modal
      setEditModal({ show: false, business: null });
      setEditForm({ businessName: '', email: '', phone: '', address: '' });
      
      // You could add a success message here
    } catch (error) {
      console.error('Error updating business:', error);
      // You could add an error message here
    }
  };

  const handleSuspendConfirm = async () => {
    try {
      // Make API call to suspend the business
      await suspendBusiness(suspendModal.business._id);
      
      // Update local state to mark business as suspended
      setBusinesses(prevBusinesses => 
        prevBusinesses.map(business => 
          business._id === suspendModal.business._id 
            ? { ...business, isSuspended: true }
            : business
        )
      );
      
      // Close the modal
      setSuspendModal({ show: false, business: null });
      
      // You could add a success message here
    } catch (error) {
      console.error('Error suspending business:', error);
      // You could add an error message here
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading business management data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Business Management</h1>
        <p style={styles.subtitle}>Manage and monitor all registered businesses</p>
      </div>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search businesses by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <span style={styles.searchResults}>
          {filteredBusinesses.length} of {businesses.length} businesses
        </span>
      </div>

      <div style={styles.content}>
        {filteredBusinesses.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.tableHeaderCell}>Business Name</th>
                  <th style={styles.tableHeaderCell}>Email</th>
                  <th style={styles.tableHeaderCell}>Status</th>
                  <th style={styles.tableHeaderCell}>Total Activities</th>
                  <th style={styles.tableHeaderCell}>Recent (24h)</th>
                  <th style={styles.tableHeaderCell}>Critical</th>
                  <th style={styles.tableHeaderCell}>Last Activity</th>
                  <th style={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.map((business) => (
                  <tr 
                    key={business._id} 
                    style={styles.tableRow}
                    onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                  >
                    <td style={styles.tableCell}>
                      <div style={styles.businessNameCell}>
                        <strong>{business.businessName}</strong>
                        {business.phone && (
                          <div style={styles.businessPhone}>{business.phone}</div>
                        )}
                      </div>
                    </td>
                    <td style={styles.tableCell}>{business.email}</td>
                    <td style={styles.tableCell}>
                      <span 
                        style={styles.statusBadge} 
                        style={{ backgroundColor: getStatusColor(business) }}
                      >
                        {getStatusText(business)}
                      </span>
                    </td>
                    <td style={styles.tableCell}>{business.totalActivities}</td>
                    <td style={styles.tableCell}>{business.recentActivitiesCount}</td>
                    <td style={styles.tableCell}>{business.criticalActivitiesCount}</td>
                    <td style={styles.tableCell}>{formatDate(business.lastActivity)}</td>
                    <td style={styles.tableCell}>
                      <div style={styles.actionButtons}>
                        <button 
                          style={styles.editButton}
                          onClick={() => handleEdit(business)}
                        >
                          Edit
                        </button>
                        {business.isSuspended ? (
                          <button 
                            style={styles.reactivateButton}
                            onClick={() => handleReactivate(business)}
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button 
                            style={styles.suspendButton}
                            onClick={() => handleSuspend(business)}
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🏢</div>
            <h3 style={styles.emptyTitle}>
              {searchTerm ? 'No Businesses Found' : 'No Businesses Registered'}
            </h3>
            <p style={styles.emptyText}>
              {searchTerm 
                ? 'No businesses match your search criteria.' 
                : 'No businesses have been registered yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Business</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setEditModal({ show: false, business: null })}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Business Name:</label>
                <input
                  type="text"
                  value={editForm.businessName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, businessName: e.target.value }))}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email:</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Phone:</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Address:</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  style={styles.formTextarea}
                  rows="3"
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.cancelButton}
                onClick={() => setEditModal({ show: false, business: null })}
              >
                Cancel
              </button>
              <button 
                style={styles.saveButton}
                onClick={handleEditSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Suspend Business</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setSuspendModal({ show: false, business: null })}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Are you sure you want to suspend <strong>{suspendModal.business?.businessName}</strong>?
              </p>
              <p style={styles.modalText}>
                This will prevent the business from accessing the system until manually reactivated.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.cancelButton}
                onClick={() => setSuspendModal({ show: false, business: null })}
              >
                Cancel
              </button>
              <button 
                style={styles.suspendConfirmButton}
                onClick={handleSuspendConfirm}
              >
                Suspend Business
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '1.75rem',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
    margin: 0,
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
  },
  searchInput: {
    flex: 1,
    padding: '10px 15px',
    border: '1px solid #e1e8ed',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
  searchResults: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
  },
  tableHeaderCell: {
    padding: '12px 15px',
    textAlign: 'left',
    borderBottom: '1px solid #e1e8ed',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#2c3e50',
  },
  tableRow: {
    borderBottom: '1px solid #f1f3f4',
  },
  tableCell: {
    padding: '12px 15px',
    fontSize: '0.875rem',
    color: '#2c3e50',
  },
  businessNameCell: {
    display: 'flex',
    flexDirection: 'column',
  },
  businessPhone: {
    fontSize: '0.75rem',
    color: '#7f8c8d',
    marginTop: '2px',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#2196f3',
    color: 'white',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  suspendButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#ff9800',
    color: 'white',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  reactivateButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#4caf50',
    color: 'white',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '15px',
    opacity: '0.5',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  emptyText: {
    color: '#7f8c8d',
    fontSize: '0.875rem',
    margin: 0,
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#7f8c8d',
    fontSize: '1rem',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#e74c3c',
    fontSize: '1rem',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e1e8ed',
  },
  modalTitle: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#7f8c8d',
  },
  modalBody: {
    padding: '20px',
  },
  modalText: {
    color: '#2c3e50',
    fontSize: '0.875rem',
    margin: '0 0 10px 0',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '20px',
    borderTop: '1px solid #e1e8ed',
  },
  formGroup: {
    marginBottom: '15px',
  },
  formLabel: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '0.875rem',
    color: '#2c3e50',
    fontWeight: '500',
  },
  formInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e1e8ed',
    borderRadius: '4px',
    fontSize: '0.875rem',
  },
  formTextarea: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e1e8ed',
    borderRadius: '4px',
    fontSize: '0.875rem',
    resize: 'vertical',
  },
  cancelButton: {
    padding: '8px 16px',
    border: '1px solid #e1e8ed',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#2c3e50',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#4caf50',
    color: 'white',
    cursor: 'pointer',
  },
  suspendConfirmButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#f44336',
    color: 'white',
    cursor: 'pointer',
  },
};

export default StaffmaBusinessManagement; 