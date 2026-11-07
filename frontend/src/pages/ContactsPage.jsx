import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Heart,
  Trash2,
  Edit2,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  X,
  Share2,
  Copy,
  Check,
  Send
} from 'lucide-react';

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'family'
  const [contacts, setContacts] = useState([]);
  const [familyConnections, setFamilyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [familyLoading, setFamilyLoading] = useState(false);

  // Contact Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [isPrimary, setIsPrimary] = useState(false);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Invite Family Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('Mother');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contacts');
      if (res.data.success) {
        setContacts(res.data.contacts || []);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyConnections = async () => {
    try {
      setFamilyLoading(true);
      const res = await api.get('/family/connections');
      if (res.data.success) {
        setFamilyConnections(res.data.connections || []);
      }
    } catch (err) {
      console.error('Error fetching family connections:', err);
    } finally {
      setFamilyLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
    loadFamilyConnections();
  }, []);

  const openAddModal = () => {
    setEditingContact(null);
    setName('');
    setPhoneNumber('');
    setEmail('');
    setRelationship('Parent');
    setIsPrimary(contacts.length === 0);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhoneNumber(contact.phoneNumber);
    setEmail(contact.email || '');
    setRelationship(contact.relationship);
    setIsPrimary(contact.isPrimary);
    setFormError(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this trusted contact?')) return;
    try {
      const res = await api.delete(`/contacts/${id}`);
      if (res.data.success) {
        setContacts(contacts.filter(c => c.id !== id));
      }
    } catch (err) {
      alert('Failed to delete contact.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phoneNumber) {
      setFormError('Name and phone number are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingContact) {
        const res = await api.put(`/contacts/${editingContact.id}`, {
          name,
          phoneNumber,
          email,
          relationship,
          isPrimary
        });
        if (res.data.success) {
          await loadContacts();
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/contacts', {
          name,
          phoneNumber,
          email,
          relationship,
          isPrimary
        });
        if (res.data.success) {
          await loadContacts();
          setModalOpen(false);
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteFamily = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      setFormError('Email address is required.');
      return;
    }

    setInviteSubmitting(true);
    setFormError(null);

    try {
      const res = await api.post('/family/invite', {
        email: inviteEmail,
        name: inviteName,
        relationship: inviteRelationship
      });

      if (res.data.success) {
        setInviteSuccessMsg(`Invitation registered! Code: ${res.data.invitationCode}`);
        await loadFamilyConnections();
        setTimeout(() => {
          setInviteModalOpen(false);
          setInviteSuccessMsg(null);
          setInviteEmail('');
          setInviteName('');
        }, 1500);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to send family invitation.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] text-xs font-bold mb-2 shadow-xs">
            <Users className="w-4 h-4 text-[#494354]" />
            <span>Inner Safety Circle</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#494354]">
            Contacts & Family Guardians
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6477] mt-1 font-medium">
            Manage your emergency phone contacts and connected family guardians who monitor your journeys on the Family Dashboard.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'contacts' ? (
            <button
              onClick={openAddModal}
              className="px-5 py-3 bg-[#F8DDE5] hover:bg-[#F4CFDB] text-[#494354] border border-[#EEC5D1] font-bold text-xs rounded-2xl shadow-xs hover:scale-102 active:scale-98 transition flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4 text-[#494354]" />
              <span>Add Phone Contact</span>
            </button>
          ) : (
            <button
              onClick={() => { setFormError(null); setInviteModalOpen(true); }}
              className="px-5 py-3 bg-[#E8E0F7] hover:bg-[#DED3F2] text-[#494354] border border-[#D6C8EE] font-bold text-xs rounded-2xl shadow-xs hover:scale-102 active:scale-98 transition flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4 text-[#494354]" />
              <span>Invite Family Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#F8DDE5] pb-2">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'contacts'
              ? 'bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] shadow-xs'
              : 'text-[#6B6477] hover:bg-[#F8DDE5]/40'
          }`}
        >
          <Phone className="w-3.5 h-3.5 text-[#494354]" />
          <span>Emergency Contacts ({contacts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('family')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'family'
              ? 'bg-[#E8E0F7] text-[#494354] border border-[#D6C8EE] shadow-xs'
              : 'text-[#6B6477] hover:bg-[#E8E0F7]/40'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#494354]" />
          <span>Family Guardians ({familyConnections.length})</span>
        </button>
      </div>

      {/* Tab 1: Emergency Contacts */}
      {activeTab === 'contacts' && (
        <>
          {loading ? (
            <div className="py-12 text-center text-[#8E869B] text-xs">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#F8DDE5] shadow-soft max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F8DDE5] text-[#494354] flex items-center justify-center mx-auto shadow-xs">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-[#494354]">No Emergency Contacts Yet</h3>
              <p className="text-xs text-[#6B6477]">
                Add at least one family member so they can receive phone calls and emergency SMS alerts during SOS triggers.
              </p>
              <button
                onClick={openAddModal}
                className="px-5 py-2.5 bg-[#F8DDE5] hover:bg-[#F4CFDB] text-[#494354] border border-[#EEC5D1] font-bold text-xs rounded-2xl shadow-xs transition"
              >
                Add First Contact
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`bg-white rounded-3xl p-6 border transition hover:shadow-soft-md flex flex-col justify-between ${
                    contact.isPrimary ? 'border-[#EEC5D1] ring-2 ring-[#F8DDE5]' : 'border-[#F8DDE5]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] flex items-center justify-center font-bold text-lg shadow-xs">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {contact.isPrimary && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FFF0BD] text-[#494354] border border-[#F5DC96]">
                            Primary SOS
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-[#494354]">{contact.name}</h3>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#F8DDE5]/40 text-[#494354] border border-[#EEC5D1]">
                      {contact.relationship}
                    </span>

                    <div className="mt-4 space-y-2 text-xs text-[#6B6477]">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-[#494354]" />
                        <span>{contact.phoneNumber}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-[#8E869B]" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#F8DDE5] flex items-center justify-between">
                    <a
                      href={`tel:${contact.phoneNumber}`}
                      className="text-xs font-bold text-[#494354] hover:underline flex items-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(contact)}
                        className="p-2 text-[#8E869B] hover:text-[#494354] rounded-xl hover:bg-[#F8DDE5]/50 transition"
                        title="Edit Contact"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-2 text-[#8E869B] hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                        title="Remove Contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Family Guardians in Lavender (#E8E0F7) */}
      {activeTab === 'family' && (
        <>
          {familyLoading ? (
            <div className="py-12 text-center text-[#8E869B] text-xs">Loading family guardians...</div>
          ) : familyConnections.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#D6C8EE] shadow-soft max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E8E0F7] text-[#494354] flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-[#494354]">No Family Guardians Connected Yet</h3>
              <p className="text-xs text-[#6B6477]">
                Invite your parents or partner by email. Once they register a Family account, you can select them when starting a journey to share your live GPS radar.
              </p>
              <button
                onClick={() => setInviteModalOpen(true)}
                className="px-5 py-2.5 bg-[#E8E0F7] hover:bg-[#DED3F2] text-[#494354] border border-[#D6C8EE] font-bold text-xs rounded-2xl shadow-xs transition"
              >
                Invite Family Guardian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {familyConnections.map((conn) => {
                const displayName = conn.name || conn.familyMember?.fullName || conn.email;
                const emailStr = conn.email || conn.familyMember?.email;
                return (
                  <div
                    key={conn.id}
                    className="bg-white rounded-3xl p-6 border border-[#D6C8EE] shadow-soft flex flex-col justify-between hover:shadow-soft-md transition"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#E8E0F7] text-[#494354] border border-[#D6C8EE] flex items-center justify-center font-bold text-lg shadow-xs">
                          {displayName.charAt(0)}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          conn.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-[#FFF0BD] text-[#494354] border border-[#F5DC96]'
                        }`}>
                          {conn.status === 'ACCEPTED' ? 'Linked Guardian' : 'Pending Signup'}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-[#494354]">{displayName}</h3>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#E8E0F7]/50 text-[#494354] border border-[#D6C8EE]">
                        {conn.relationship}
                      </span>

                      <div className="mt-4 space-y-2 text-xs text-[#6B6477]">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-[#8E869B]" />
                          <span className="truncate">{emailStr}</span>
                        </div>
                        {conn.invitationCode && (
                          <div className="flex items-center justify-between p-2 bg-[#FFFCF8] rounded-xl border border-[#D6C8EE]">
                            <span className="font-mono text-[11px] text-[#494354]">
                              Code: {conn.invitationCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(conn.invitationCode, conn.id)}
                              className="text-[10px] font-bold text-[#494354] flex items-center space-x-1 hover:underline"
                            >
                              {copiedCode === conn.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedCode === conn.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#D6C8EE] flex items-center justify-between text-xs text-[#6B6477]">
                      <span>Live Radar Access</span>
                      <span className="text-emerald-700 font-bold">Enabled on Trips</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Contact Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#FFFCF8] rounded-3xl p-6 sm:p-7 border border-[#F8DDE5] shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F8DDE5]">
              <h3 className="font-extrabold text-base text-[#494354]">
                {editingContact ? 'Edit Trusted Contact' : 'Add Trusted Contact'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-[#8E869B] hover:text-[#494354] hover:bg-[#F8DDE5]/40 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#494354] mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunita Patel"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-[#EEC5D1] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#D98A9F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#494354] mb-1">Phone Number (with Country Code)</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98200 11223"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-[#EEC5D1] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#D98A9F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#494354] mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="family@example.com"
                  className="w-full px-4 py-2.5 bg-white border border-[#EEC5D1] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#D98A9F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#494354] mb-1">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#EEC5D1] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#D98A9F]"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Parent">Parent</option>
                  <option value="Sister">Sister</option>
                  <option value="Brother">Brother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Partner">Partner</option>
                  <option value="Friend">Friend</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="w-4 h-4 accent-[#494354] rounded"
                  />
                  <span className="text-xs font-bold text-[#494354]">Set as Primary Emergency Contact</span>
                </label>
                <p className="text-[11px] text-[#8E869B] mt-1 pl-6">
                  Primary contact receives top-priority calls and instant SMS alerts during SOS triggers.
                </p>
              </div>

              <div className="pt-3 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-white hover:bg-slate-100 text-[#6B6477] border border-[#EEC5D1] rounded-2xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-[#F8DDE5] hover:bg-[#F4CFDB] text-[#494354] border border-[#EEC5D1] rounded-2xl text-xs font-bold shadow-xs transition"
                >
                  {submitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Family Guardian Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#FFFCF8] rounded-3xl p-6 sm:p-7 border border-[#D6C8EE] shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D6C8EE]">
              <h3 className="font-extrabold text-base text-[#494354] flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-[#494354]" />
                <span>Invite Family Guardian</span>
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="p-1.5 rounded-full text-[#8E869B] hover:text-[#494354] hover:bg-[#E8E0F7]/40 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {inviteSuccessMsg && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{inviteSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleInviteFamily} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#494354] mb-1">Guardian's Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. sunita@safarsakhi.com"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-[#D6C8EE] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#9C85C7] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#494354] mb-1">Guardian's Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Sunita Patel (Mom)"
                  className="w-full px-4 py-2.5 bg-white border border-[#D6C8EE] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#9C85C7] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#494354] mb-1">Relationship</label>
                <select
                  value={inviteRelationship}
                  onChange={(e) => setInviteRelationship(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#D6C8EE] rounded-2xl text-xs sm:text-sm text-[#494354] focus:outline-none focus:ring-2 focus:ring-[#9C85C7]"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Partner">Partner</option>
                  <option value="Sister">Sister</option>
                  <option value="Brother">Brother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Friend">Friend</option>
                </select>
              </div>

              <div className="p-3.5 bg-[#FFF0BD]/50 rounded-2xl border border-[#F5DC96] text-[11px] text-[#494354] leading-relaxed">
                🛡️ <b>How it works:</b> When your family member signs up with this email (or via Google with this account), their Family Dashboard automatically links to your profile.
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="flex-1 py-3 bg-white hover:bg-slate-100 text-[#6B6477] border border-[#D6C8EE] rounded-2xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="flex-1 py-3 bg-[#E8E0F7] hover:bg-[#DED3F2] text-[#494354] border border-[#D6C8EE] rounded-2xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{inviteSubmitting ? 'Sending...' : 'Send Invitation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

