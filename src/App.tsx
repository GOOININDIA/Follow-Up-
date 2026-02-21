/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  LayoutDashboard, 
  Users, 
  Settings, 
  Plus, 
  Phone, 
  Bike, 
  IndianRupee, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  X, 
  Download, 
  Info, 
  Mail, 
  User,
  ChevronRight,
  Search,
  HelpCircle,
  BookOpen,
  MousePointer2,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FollowUp, TeamMember, Stats } from './types';

// --- Components ---

const Card = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-white rounded-2xl p-4 shadow-sm border border-black/5 ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false }: any) => {
  const variants = {
    primary: 'bg-black text-white hover:bg-zinc-800',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100'
  };
  return (
    <button 
      disabled={disabled}
      onClick={onClick} 
      className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{label}</label>}
    <input 
      {...props} 
      className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
    />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 ml-1">{label}</label>}
    <select 
      {...props} 
      className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<Stats>({ total_due: 0, total_follow_ups: 0, due_today: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      checkAndNotify();
    }
  };

  const checkAndNotify = () => {
    if (notificationPermission !== 'granted') return;

    const today = new Date().toISOString().split('T')[0];
    const todayFollowUps = followUps.filter(fu => fu.next_follow_up === today && fu.status === 'pending');
    
    // Get already notified IDs from session storage to avoid duplicates in current session
    const notifiedIds = JSON.parse(sessionStorage.getItem('notified_ids') || '[]');
    
    todayFollowUps.forEach(fu => {
      if (!notifiedIds.includes(fu.id)) {
        new Notification("Follow-up Reminder", {
          body: `Customer: ${fu.customer_name}\nReason: Follow-up for ${fu.bike || 'purchase'}`,
          icon: '/favicon.ico' // Default icon
        });
        notifiedIds.push(fu.id);
      }
    });
    
    sessionStorage.setItem('notified_ids', JSON.stringify(notifiedIds));
  };

  const fetchData = async () => {
    try {
      const [fuRes, teamRes, statsRes] = await Promise.all([
        fetch('/api/follow-ups'),
        fetch('/api/team'),
        fetch('/api/stats')
      ]);
      setFollowUps(await fuRes.json());
      setTeam(await teamRes.json());
      setStats(await statsRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchData();
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (followUps.length > 0 && notificationPermission === 'granted') {
      checkAndNotify();
    }
  }, [followUps, notificationPermission]);

  const handleSaveFollowUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const url = editingFollowUp ? `/api/follow-ups/${editingFollowUp.id}` : '/api/follow-ups';
    const method = editingFollowUp ? 'PUT' : 'POST';

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          due_amount: Number(data.due_amount)
        })
      });
      setIsModalOpen(false);
      setEditingFollowUp(null);
      fetchData();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleDeleteFollowUp = async (id: number) => {
    if (!confirm("Are you sure you want to delete this follow-up?")) return;
    try {
      await fetch(`/api/follow-ups/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleSaveTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setIsTeamModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Team save failed", err);
    }
  };

  const handleDeleteTeam = async (id: number) => {
    if (!confirm("Remove team member?")) return;
    try {
      await fetch(`/api/team/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const filteredFollowUps = followUps.filter(fu => {
    const matchesSearch = fu.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         fu.phone.includes(searchQuery);
    
    if (searchQuery) return matchesSearch;
    
    if (activeTab === 'today') {
      return fu.next_follow_up === today && matchesSearch;
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {searchQuery ? 'Search Results' : 'The Follow Up'}
            </h1>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mt-0.5">
              {searchQuery ? `Found ${filteredFollowUps.length} matches` : (activeTab === 'today' ? "Today's Schedule" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
            </p>
          </div>
          {activeTab === 'today' && (
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="relative w-full max-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full pl-10 pr-10 py-2 bg-zinc-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {searchQuery ? (
            <motion.div 
              key="search-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {filteredFollowUps.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h3 className="text-zinc-900 font-semibold">No matches found</h3>
                  <p className="text-zinc-500 text-sm mt-1">Try searching for a different name or number</p>
                </div>
              ) : (
                filteredFollowUps.map(fu => (
                  <Card key={fu.id} className="group hover:border-black/20 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">{fu.customer_name}</h3>
                        <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{fu.phone}</span>
                          {fu.secondary_phone && <span className="text-zinc-300">|</span>}
                          {fu.secondary_phone && <span>{fu.secondary_phone}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" className="p-2" onClick={() => { setEditingFollowUp(fu); setIsModalOpen(true); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" className="p-2 text-red-500 hover:bg-red-50" onClick={() => handleDeleteFollowUp(fu.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-black/5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                          <Bike className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Bike Model</p>
                          <p className="text-sm font-semibold text-zinc-700">{fu.bike || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <IndianRupee className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Due Amount</p>
                          <p className="text-sm font-bold text-emerald-700">₹{fu.due_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Next: {fu.next_follow_up}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${fu.finance_cash === 'Finance' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {fu.finance_cash}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </motion.div>
          ) : (
            <>
              {activeTab === 'today' && (
            <motion.div 
              key="today"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {filteredFollowUps.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h3 className="text-zinc-900 font-semibold">No follow-ups for today</h3>
                  <p className="text-zinc-500 text-sm mt-1">Enjoy your free time or add a new one!</p>
                </div>
              ) : (
                filteredFollowUps.map(fu => (
                  <Card key={fu.id} className="group hover:border-black/20 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">{fu.customer_name}</h3>
                        <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{fu.phone}</span>
                          {fu.secondary_phone && <span className="text-zinc-300">|</span>}
                          {fu.secondary_phone && <span>{fu.secondary_phone}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" className="p-2" onClick={() => { setEditingFollowUp(fu); setIsModalOpen(true); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" className="p-2 text-red-500 hover:bg-red-50" onClick={() => handleDeleteFollowUp(fu.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-black/5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                          <Bike className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Bike Model</p>
                          <p className="text-sm font-semibold text-zinc-700">{fu.bike || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <IndianRupee className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Due Amount</p>
                          <p className="text-sm font-bold text-emerald-700">₹{fu.due_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Purchased: {fu.purchase_date || 'N/A'}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${fu.finance_cash === 'Finance' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {fu.finance_cash}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-black text-white border-none">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Total Due Amount</p>
                  <h2 className="text-4xl font-black mt-2">₹{(stats.total_due || 0).toLocaleString()}</h2>
                  <div className="mt-4 flex items-center gap-2 text-zinc-400 text-sm">
                    <IndianRupee className="w-4 h-4" />
                    <span>Outstanding Payments</span>
                  </div>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Total Leads</p>
                    <h2 className="text-2xl font-bold mt-1">{stats.total_follow_ups}</h2>
                  </Card>
                  <Card>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Due Today</p>
                    <h2 className="text-2xl font-bold mt-1 text-red-600">{stats.due_today}</h2>
                  </Card>
                </div>
              </div>

              <Card>
                <h3 className="font-bold text-zinc-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" className="flex items-center justify-center gap-2 py-4" onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4" /> New Follow Up
                  </Button>
                  <Button variant="secondary" className="flex items-center justify-center gap-2 py-4" onClick={() => setIsTeamModalOpen(true)}>
                    <Users className="w-4 h-4" /> Add Team
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div 
              key="team"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-zinc-900">Team Members ({team.length})</h3>
                <Button variant="secondary" className="text-xs py-1.5" onClick={() => setIsTeamModalOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" /> Add Member
                </Button>
              </div>
              {team.map(member => (
                <Card key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{member.name}</h4>
                      <p className="text-xs text-zinc-500">{member.role} • {member.phone}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-red-500" onClick={() => handleDeleteTeam(member.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <Card className="divide-y divide-black/5 p-0 overflow-hidden">
                <div className="p-4 flex items-center justify-between hover:bg-zinc-50 cursor-pointer group" onClick={() => setIsGuideOpen(true)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">Application Guide</p>
                      <p className="text-xs text-zinc-500">Learn how to use the app</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500" />
                </div>

                <div className="p-4 flex items-center justify-between hover:bg-zinc-50 cursor-pointer group" onClick={requestNotificationPermission}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notificationPermission === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-600'}`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">Push Notifications</p>
                      <p className="text-xs text-zinc-500">
                        {notificationPermission === 'granted' ? 'Notifications are enabled' : 'Click to enable reminders'}
                      </p>
                    </div>
                  </div>
                  {notificationPermission !== 'granted' && <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500" />}
                </div>

                <div className="p-4 flex items-center justify-between hover:bg-zinc-50 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">Check for Updates</p>
                      <p className="text-xs text-zinc-500">Download the latest version</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500" />
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">About Application</p>
                      <p className="text-xs text-zinc-500">Version 1.0.0 (Stable)</p>
                    </div>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-500">Developer:</span>
                      <span className="font-bold text-zinc-900">Rajbir Singh</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-500">Contact:</span>
                      <a href="mailto:rajbirsinghrx@gmail.com" className="font-bold text-zinc-900 hover:underline">rajbirsinghrx@gmail.com</a>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="text-center">
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em]">Crafted with precision</p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  </main>

      {/* Floating Action Button */}
      <AnimatePresence>
        {activeTab === 'today' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditingFollowUp(null); setIsModalOpen(true); }}
            className="fixed right-6 bottom-24 w-14 h-14 bg-black text-white rounded-2xl shadow-xl flex items-center justify-center z-40"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 px-6 py-3 z-40">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          {[
            { id: 'today', icon: Calendar, label: 'Today' },
            { id: 'dashboard', icon: LayoutDashboard, label: 'Stats' },
            { id: 'team', icon: Users, label: 'Team' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-black' : 'text-zinc-400'}`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'fill-black/10' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="nav-indicator" className="w-1 h-1 bg-black rounded-full mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Follow Up Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-black/5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900">{editingFollowUp ? 'Edit Follow Up' : 'New Follow Up'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <form onSubmit={handleSaveFollowUp} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Customer Name" name="customer_name" defaultValue={editingFollowUp?.customer_name} required placeholder="e.g. John Doe" />
                  <Input label="Phone Number" name="phone" defaultValue={editingFollowUp?.phone} required placeholder="10-digit number" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Second Number" name="secondary_phone" defaultValue={editingFollowUp?.secondary_phone} placeholder="Optional" />
                  <Input label="Bike Model" name="bike" defaultValue={editingFollowUp?.bike} placeholder="e.g. Royal Enfield Classic 350" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Purchase Date" name="purchase_date" type="date" defaultValue={editingFollowUp?.purchase_date} />
                  <Input label="Next Follow Up" name="next_follow_up" type="date" defaultValue={editingFollowUp?.next_follow_up || today} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select 
                    label="Payment Type" 
                    name="finance_cash" 
                    defaultValue={editingFollowUp?.finance_cash || 'Cash'}
                    options={[
                      { value: 'Cash', label: 'Cash' },
                      { value: 'Finance', label: 'Finance' }
                    ]} 
                  />
                  <Input label="Due Amount (₹)" name="due_amount" type="number" defaultValue={editingFollowUp?.due_amount || 0} placeholder="0.00" />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" className="flex-1" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button className="flex-[2]" type="submit">
                    {editingFollowUp ? 'Update Follow Up' : 'Create Follow Up'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Modal */}
      <AnimatePresence>
        {isTeamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTeamModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-black/5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900">Add Team Member</h2>
                <button onClick={() => setIsTeamModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <form onSubmit={handleSaveTeam} className="p-6 space-y-4">
                <Input label="Full Name" name="name" required placeholder="e.g. Rajbir Singh" />
                <Input label="Role" name="role" required placeholder="e.g. Sales Manager" />
                <Input label="Phone" name="phone" required placeholder="Contact number" />
                
                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" className="flex-1" type="button" onClick={() => setIsTeamModalOpen(false)}>Cancel</Button>
                  <Button className="flex-[2]" type="submit">Add Member</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guide Modal */}
      <AnimatePresence>
        {isGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGuideOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-black/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-bold text-zinc-900">Application Guide</h2>
                </div>
                <button onClick={() => setIsGuideOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-black" />
                    <h3 className="font-bold text-zinc-900">Adding Follow-Ups</h3>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Click the floating <span className="font-bold text-black">+</span> button at the bottom right of any screen to add a new customer follow-up. Fill in the customer details, bike model, and the next follow-up date.
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-black" />
                    <h3 className="font-bold text-zinc-900">Daily Schedule</h3>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    The <span className="font-bold">Today</span> tab shows all follow-ups scheduled for the current date. You can edit or delete them directly from the cards.
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-black" />
                    <h3 className="font-bold text-zinc-900">Push Notifications</h3>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Enable <span className="font-bold">Push Notifications</span> in the Settings tab to receive real-time reminders for today's follow-ups. Ensure you grant browser permission when prompted.
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-black" />
                    <h3 className="font-bold text-zinc-900">Team Management</h3>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Use the <span className="font-bold">Team</span> tab to keep track of your sales staff and their roles. You can add new members or remove existing ones as your team grows.
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-black" />
                    <h3 className="font-bold text-zinc-900">Dashboard & Stats</h3>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    The <span className="font-bold">Stats</span> tab provides a quick overview of total outstanding due amounts and lead counts to help you track business performance.
                  </p>
                </section>

                <div className="pt-4">
                  <Button className="w-full" onClick={() => setIsGuideOpen(false)}>Got it, thanks!</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
